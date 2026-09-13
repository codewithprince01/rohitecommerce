import { Order, OrderItem } from '../../models/Order.js';
import { Customer } from '../../models/Customer.js';
import { Product, Category } from '../../models/Catalog.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';

const DAY_MS = 86400000;
const VOID = ['cancelled', 'returned'];
const PRODUCTS = Product.collection.name;
const CATEGORIES = Category.collection.name;
const CUSTOMERS = Customer.collection.name;
const ORDERS = Order.collection.name;

// Period-over-period metric, matching the dashboard's shape.
const metric = (value, prev) => ({
  value,
  prev,
  changePct: prev > 0 ? ((value - prev) / prev) * 100 : null,
});

// Order-level rollups for a date window: valid revenue composition + counts.
function orderWindowFacet() {
  return {
    $facet: {
      all: [{ $count: 'n' }],
      valid: [
        { $match: { status: { $nin: VOID } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
            subtotal: { $sum: '$subtotal' },
            discount: { $sum: '$discount' },
            delivery: { $sum: '$delivery_fee' },
            tax: { $sum: '$tax' },
          },
        },
      ],
      void: [
        { $match: { status: { $in: VOID } } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$total' } } },
      ],
    },
  };
}

const firstOr = (arr, fallback = {}) => arr?.[0] ?? fallback;

/**
 * GET /api/reports?from=ISO&to=ISO
 * Full sales-analytics payload for an arbitrary date range, with every figure
 * computed from real orders/items/customers and compared to the immediately
 * preceding window of equal length. No client-side fabrication.
 */
export const getReport = asyncHandler(async (req, res) => {
  const now = Date.now();
  const toDate = req.query.to ? new Date(req.query.to) : new Date(now);
  const fromDate = req.query.from ? new Date(req.query.from) : new Date(now - 30 * DAY_MS);
  // Guard against an inverted range.
  const [from, to] = fromDate <= toDate ? [fromDate, toDate] : [toDate, fromDate];

  const span = to.getTime() - from.getTime();
  const prevStart = new Date(from.getTime() - span);
  const days = Math.max(1, Math.round(span / DAY_MS) + 1);

  const curRange = { placed_at: { $gte: from, $lte: to } };
  const prevRange = { placed_at: { $gte: prevStart, $lt: from } };

  const [curFacet, prevFacet, breakdowns, itemsAgg, prevItems, newCustCur, newCustPrev] =
    await Promise.all([
      // Current-window order rollup.
      Order.aggregate([{ $match: curRange }, orderWindowFacet()]),
      // Previous-window order rollup (for deltas).
      Order.aggregate([{ $match: prevRange }, orderWindowFacet()]),
      // Current-window breakdowns (status / payments / by-day / by-weekday / top customers).
      Order.aggregate([
        { $match: curRange },
        {
          $facet: {
            status: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            payments: [
              { $match: { status: { $nin: VOID } } },
              { $group: { _id: '$payment_method', total: { $sum: '$total' }, orders: { $sum: 1 } } },
              { $sort: { total: -1 } },
            ],
            byDay: [
              { $match: { status: { $nin: VOID } } },
              {
                $group: {
                  _id: { $dateToString: { format: '%Y-%m-%d', date: '$placed_at' } },
                  revenue: { $sum: '$total' },
                  orders: { $sum: 1 },
                },
              },
            ],
            byWeekday: [
              { $match: { status: { $nin: VOID } } },
              { $group: { _id: { $dayOfWeek: '$placed_at' }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
            ],
            topCustomers: [
              { $match: { status: { $nin: VOID }, customer_id: { $ne: null } } },
              { $group: { _id: '$customer_id', orders: { $sum: 1 }, total: { $sum: '$total' } } },
              { $sort: { total: -1 } },
              { $limit: 8 },
              { $lookup: { from: CUSTOMERS, localField: '_id', foreignField: '_id', as: 'c' } },
              {
                $project: {
                  _id: 0,
                  id: { $toString: '$_id' },
                  name: { $ifNull: [{ $arrayElemAt: ['$c.name', 0] }, 'Customer'] },
                  orders: 1,
                  total: 1,
                },
              },
            ],
          },
        },
      ]),
      // Current-window item-level analytics: top products, sales by category, units sold.
      OrderItem.aggregate([
        { $lookup: { from: ORDERS, localField: 'order_id', foreignField: '_id', as: 'o' } },
        { $unwind: '$o' },
        { $match: { 'o.placed_at': { $gte: from, $lte: to }, 'o.status': { $nin: VOID } } },
        {
          $facet: {
            total: [{ $group: { _id: null, qty: { $sum: '$quantity' } } }],
            topProducts: [
              { $group: { _id: '$product_name', qty: { $sum: '$quantity' }, revenue: { $sum: '$line_total' } } },
              { $sort: { revenue: -1 } },
              { $limit: 10 },
            ],
            byCategory: [
              { $match: { product_id: { $ne: null } } },
              { $lookup: { from: PRODUCTS, localField: 'product_id', foreignField: '_id', as: 'p' } },
              { $unwind: '$p' },
              { $group: { _id: '$p.category_id', revenue: { $sum: '$line_total' }, qty: { $sum: '$quantity' } } },
              { $sort: { revenue: -1 } },
              { $limit: 8 },
              { $lookup: { from: CATEGORIES, localField: '_id', foreignField: '_id', as: 'cat' } },
              {
                $project: {
                  _id: 0,
                  id: { $toString: '$_id' },
                  name: { $ifNull: [{ $arrayElemAt: ['$cat.name', 0] }, 'Uncategorized'] },
                  revenue: 1,
                  qty: 1,
                },
              },
            ],
          },
        },
      ]),
      // Previous-window units sold (for the items-sold delta).
      OrderItem.aggregate([
        { $lookup: { from: ORDERS, localField: 'order_id', foreignField: '_id', as: 'o' } },
        { $unwind: '$o' },
        { $match: { 'o.placed_at': { $gte: prevStart, $lt: from }, 'o.status': { $nin: VOID } } },
        { $group: { _id: null, qty: { $sum: '$quantity' } } },
      ]),
      Customer.countDocuments({ created_at: { $gte: from, $lte: to } }),
      Customer.countDocuments({ created_at: { $gte: prevStart, $lt: from } }),
    ]);

  const cur = firstOr(curFacet);
  const prev = firstOr(prevFacet);
  const bd = firstOr(breakdowns);
  const items = firstOr(itemsAgg);

  const curValid = firstOr(cur.valid);
  const prevValid = firstOr(prev.valid);
  const curVoid = firstOr(cur.void, { count: 0, revenue: 0 });
  const curAll = firstOr(cur.all, { n: 0 }).n ?? 0;
  const prevAll = firstOr(prev.all, { n: 0 }).n ?? 0;

  const curRevenue = curValid.revenue ?? 0;
  const prevRevenue = prevValid.revenue ?? 0;
  const curValidOrders = curValid.orders ?? 0;
  const prevValidOrders = prevValid.orders ?? 0;
  const curItems = firstOr(items.total, { qty: 0 }).qty ?? 0;
  const prevItemsQty = firstOr(prevItems, { qty: 0 }).qty ?? 0;

  // Continuous daily series (fill gaps with zero) when the range is chart-friendly.
  const dayMap = new Map((bd.byDay ?? []).map((d) => [d._id, d]));
  let byDay;
  if (days <= 92) {
    byDay = [];
    for (let i = 0; i < days; i++) {
      const key = new Date(from.getTime() + i * DAY_MS).toISOString().slice(0, 10);
      const hit = dayMap.get(key);
      byDay.push({ date: key, revenue: hit?.revenue ?? 0, orders: hit?.orders ?? 0 });
    }
  } else {
    byDay = (bd.byDay ?? [])
      .map((d) => ({ date: d._id, revenue: d.revenue, orders: d.orders }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Weekday pattern (Mongo $dayOfWeek: 1=Sun … 7=Sat) → fixed 7-slot array.
  const wdMap = new Map((bd.byWeekday ?? []).map((w) => [w._id, w]));
  const byWeekday = Array.from({ length: 7 }, (_, i) => {
    const hit = wdMap.get(i + 1);
    return { weekday: i + 1, revenue: hit?.revenue ?? 0, orders: hit?.orders ?? 0 };
  });

  const statusBreakdown = Object.fromEntries((bd.status ?? []).map((s) => [s._id, s.count]));
  const paymentSplit = (bd.payments ?? []).map((p) => ({ method: p._id, total: p.total, orders: p.orders }));
  const topProducts = (items.topProducts ?? []).map((p) => ({ name: p._id, qty: p.qty, revenue: p.revenue }));

  return ok(res, {
    range: { from: from.toISOString(), to: to.toISOString(), days },
    revenue: metric(curRevenue, prevRevenue),
    orders: metric(curAll, prevAll),
    avgOrderValue: metric(
      curValidOrders ? curRevenue / curValidOrders : 0,
      prevValidOrders ? prevRevenue / prevValidOrders : 0
    ),
    itemsSold: metric(curItems, prevItemsQty),
    newCustomers: metric(newCustCur, newCustPrev),
    discounts: metric(curValid.discount ?? 0, prevValid.discount ?? 0),
    composition: {
      subtotal: curValid.subtotal ?? 0,
      discount: curValid.discount ?? 0,
      delivery: curValid.delivery ?? 0,
      tax: curValid.tax ?? 0,
      total: curRevenue,
    },
    cancelledCount: curVoid.count ?? 0,
    cancelledRevenue: curVoid.revenue ?? 0,
    validOrders: curValidOrders,
    fulfilledRate: curValidOrders ? ((statusBreakdown.delivered ?? 0) / curValidOrders) * 100 : 0,
    byDay,
    byWeekday,
    statusBreakdown,
    paymentSplit,
    salesByCategory: items.byCategory ?? [],
    topProducts,
    topCustomers: bd.topCustomers ?? [],
  });
});
