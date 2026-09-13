import { Order, OrderItem } from '../../models/Order.js';
import { Customer } from '../../models/Customer.js';
import { ProductVariant } from '../../models/Catalog.js';
import { Notification, ActivityLog } from '../../models/Operations.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';

const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90 };
const LOW_STOCK_THRESHOLD = 10;
const DAY_MS = 86400000;
const VOID = ['cancelled', 'returned'];
const EMPTY_STATUS = {
  pending: 0, confirmed: 0, packed: 0, out_for_delivery: 0, delivered: 0, cancelled: 0, returned: 0,
};

const sum = (arr, f) => arr.reduce((s, o) => s + Number(f(o)), 0);
const isValid = (o) => !VOID.includes(o.status);
const metric = (value, prev) => ({
  value,
  prev,
  changePct: prev > 0 ? ((value - prev) / prev) * 100 : null,
});

// GET /api/dashboard?range=7d|30d|90d
export const getDashboard = asyncHandler(async (req, res) => {
  const range = RANGE_DAYS[req.query.range] ? req.query.range : '7d';
  const days = RANGE_DAYS[range];
  const now = Date.now();
  const curStart = new Date(now - days * DAY_MS);
  const prevStart = new Date(now - 2 * days * DAY_MS);

  const windowOrders = await Order.find({ placed_at: { $gte: prevStart } })
    .populate('customer', 'name')
    .sort({ placed_at: -1 })
    .limit(5000)
    .lean({ virtuals: true });

  const curOrders = windowOrders.filter((o) => new Date(o.placed_at) >= curStart);
  const prevOrders = windowOrders.filter(
    (o) => new Date(o.placed_at) >= prevStart && new Date(o.placed_at) < curStart
  );
  const curValid = curOrders.filter(isValid);
  const prevValid = prevOrders.filter(isValid);

  const curRevenue = sum(curValid, (o) => o.total);
  const prevRevenue = sum(prevValid, (o) => o.total);

  // Status breakdown (current period)
  const statusBreakdown = { ...EMPTY_STATUS };
  for (const o of curOrders) statusBreakdown[o.status] = (statusBreakdown[o.status] ?? 0) + 1;

  // Daily sales series
  const salesMap = new Map();
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(now - i * DAY_MS).toISOString().slice(0, 10);
    salesMap.set(key, { date: key, revenue: 0, orders: 0 });
  }
  for (const o of curValid) {
    const key = new Date(o.placed_at).toISOString().slice(0, 10);
    const pt = salesMap.get(key);
    if (pt) { pt.revenue += Number(o.total); pt.orders += 1; }
  }
  const salesByDay = [...salesMap.values()];

  // Payment-method split
  const payMap = new Map();
  for (const o of curValid) {
    const cur = payMap.get(o.payment_method) ?? { method: o.payment_method, orders: 0, total: 0 };
    cur.orders += 1; cur.total += Number(o.total);
    payMap.set(o.payment_method, cur);
  }
  const paymentSplit = [...payMap.values()].sort((a, b) => b.total - a.total);

  // Unpaid exposure
  const unpaid = curOrders.filter(
    (o) => isValid(o) && (o.payment_status === 'pending' || o.payment_status === 'failed')
  );

  // Top customers
  const custMap = new Map();
  for (const o of curValid) {
    if (!o.customer_id) continue;
    const id = String(o.customer_id);
    const cur = custMap.get(id) ?? { id, name: o.customer?.name ?? 'Customer', orders: 0, total: 0 };
    cur.orders += 1; cur.total += Number(o.total);
    custMap.set(id, cur);
  }
  const topCustomers = [...custMap.values()].sort((a, b) => b.total - a.total).slice(0, 5);

  // Top products from order_items of current orders
  const curOrderIds = curOrders.map((o) => o._id).slice(0, 800);
  let topProducts = [];
  if (curOrderIds.length) {
    const items = await OrderItem.aggregate([
      { $match: { order_id: { $in: curOrderIds } } },
      {
        $group: {
          _id: '$product_name',
          qty: { $sum: '$quantity' },
          revenue: { $sum: '$line_total' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 6 },
    ]);
    topProducts = items.map((i) => ({ name: i._id, qty: i.qty, revenue: i.revenue }));
  }

  const [
    newCustCur, newCustPrev, totalCustomers,
    pendingOrders, processingOrders, outForDelivery,
    lowStockCount, outOfStockCount, unreadNotifications,
    lowStockDocs, recentActivity,
  ] = await Promise.all([
    Customer.countDocuments({ created_at: { $gte: curStart } }),
    Customer.countDocuments({ created_at: { $gte: prevStart, $lt: curStart } }),
    Customer.countDocuments({}),
    Order.countDocuments({ status: 'pending' }),
    Order.countDocuments({ status: { $in: ['confirmed', 'packed'] } }),
    Order.countDocuments({ status: 'out_for_delivery' }),
    ProductVariant.countDocuments({ stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } }),
    ProductVariant.countDocuments({ stock: { $lte: 0 } }),
    Notification.countDocuments({ is_read: false }),
    ProductVariant.find({ stock: { $lte: LOW_STOCK_THRESHOLD } })
      .populate('product', 'name')
      .sort({ stock: 1 })
      .limit(6)
      .lean({ virtuals: true }),
    ActivityLog.find({}).sort({ created_at: -1 }).limit(7).lean({ virtuals: true }),
  ]);

  const lowStockItems = lowStockDocs.map((v) => ({
    id: String(v._id),
    productId: String(v.product_id),
    productName: v.product?.name ?? 'Unknown product',
    variantLabel: v.quantity ?? '',
    stock: Number(v.stock),
  }));

  const fulfilledRate = curValid.length ? (statusBreakdown.delivered / curValid.length) * 100 : 0;

  return ok(res, {
    range,
    revenue: metric(curRevenue, prevRevenue),
    orders: metric(curOrders.length, prevOrders.length),
    avgOrderValue: metric(
      curValid.length ? curRevenue / curValid.length : 0,
      prevValid.length ? prevRevenue / prevValid.length : 0
    ),
    newCustomers: metric(newCustCur, newCustPrev),
    pendingOrders, processingOrders, outForDelivery, totalCustomers,
    lowStockCount, outOfStockCount,
    unpaidRevenue: sum(unpaid, (o) => o.total),
    unpaidOrders: unpaid.length,
    unreadNotifications,
    statusBreakdown,
    paymentSplit,
    salesByDay,
    topProducts,
    topCustomers,
    recentOrders: curOrders.slice(0, 7).map((o) => ({
      ...o,
      id: String(o._id),
      customer: o.customer ? { ...o.customer, id: String(o.customer._id) } : null,
    })),
    lowStockItems,
    recentActivity: recentActivity.map((a) => ({ ...a, id: String(a._id) })),
    fulfilledRate,
  });
});
