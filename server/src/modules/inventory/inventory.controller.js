import mongoose from 'mongoose';
import { Product, ProductVariant, Category } from '../../models/Catalog.js';
import { Order, OrderItem } from '../../models/Order.js';
import { InventoryMovement } from '../../models/Operations.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, paginated } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { parseListParams, searchFilter, equalityFilters } from '../../utils/query.js';
import { logActivity, notify } from '../../services/activity.service.js';

// Default reorder point for SKUs that don't carry their own low_stock_threshold
// (kept in sync with the products module's LOW_STOCK_THRESHOLD).
export const DEFAULT_LOW_STOCK = 10;
// Days of demand a "days of cover" / reorder suggestion targets, and the
// overstock cut-off (more than ~3 months of cover ties up working capital).
const COVER_TARGET_DAYS = 14;
const OVERSTOCK_DAYS = 90;
const SALES_WINDOW_DAYS = 30;

// Collection names (resilient to Mongoose pluralization changes).
const PRODUCTS = Product.collection.name;
const CATEGORIES = Category.collection.name;
const ORDERS = Order.collection.name;
const ORDER_ITEMS = OrderItem.collection.name;
const MOVEMENTS = InventoryMovement.collection.name;

// Orders in these states never consumed stock, so they're excluded from
// sales-velocity maths.
const NON_SALE_STATUSES = ['cancelled', 'returned'];

const windowStart = (days) => new Date(Date.now() - days * 86400000);

/* ----------------------- Shared aggregation fragments ---------------------- */

// Correlated sub-pipeline: units sold for the current variant within the sales
// window, ignoring cancelled/returned orders. Real order data — never faked.
const salesLookup = (since) => ({
  $lookup: {
    from: ORDER_ITEMS,
    let: { vid: '$_id' },
    pipeline: [
      { $match: { $expr: { $eq: ['$variant_id', '$$vid'] } } },
      { $lookup: { from: ORDERS, localField: 'order_id', foreignField: '_id', as: 'o' } },
      { $unwind: '$o' },
      { $match: { 'o.placed_at': { $gte: since }, 'o.status': { $nin: NON_SALE_STATUSES } } },
      { $group: { _id: null, qty: { $sum: '$quantity' } } },
    ],
    as: 'sales',
  },
});

// Most recent stock movement for the current variant (for the "last moved" col).
const lastMovementLookup = {
  $lookup: {
    from: MOVEMENTS,
    let: { vid: '$_id' },
    pipeline: [
      { $match: { $expr: { $eq: ['$variant_id', '$$vid'] } } },
      { $sort: { created_at: -1 } },
      { $limit: 1 },
      { $project: { _id: 0, created_at: 1, change: 1, reason: 1 } },
    ],
    as: 'lastMove',
  },
};

/**
 * Paginated inventory list. Each row is a SKU (product variant) enriched with
 * its product + category, stock valuation, live stock status against its own
 * reorder point, and demand signals (30-day units sold, days of cover) computed
 * from real orders — all in one aggregation so the table can sort/filter on the
 * derived fields without N+1 queries.
 */
export const listInventory = asyncHandler(async (req, res) => {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseListParams(req.query);
  const since = windowStart(SALES_WINDOW_DAYS);

  // Variant-level equality filter(s).
  const variantMatch = equalityFilters(req.query, ['is_available']);

  // Product-level filters (search on product name, category) are applied after
  // the product join below.
  const productMatch = {
    ...searchFilter(search, ['product.name', 'product.slug']),
  };
  if (req.query.category_id && mongoose.isValidObjectId(req.query.category_id)) {
    productMatch['product.category_id'] = new mongoose.Types.ObjectId(req.query.category_id);
  }

  // Stock-status / demand filter operates on computed fields.
  const stock = req.query.stock;
  const statusMatch =
    stock === 'in' || stock === 'healthy'
      ? { stock_status: 'healthy' }
      : stock === 'low'
      ? { stock_status: 'low' }
      : stock === 'out'
      ? { stock_status: 'out' }
      : stock === 'over'
      ? { days_of_cover: { $ne: null, $gt: OVERSTOCK_DAYS } }
      : stock === 'dead'
      ? { sold_30d: { $lte: 0 }, stock: { $gt: 0 } }
      : null;

  // Whitelisted sort fields → actual aggregation paths. Default surfaces the
  // most urgent SKUs first (lowest stock).
  const SORT_MAP = {
    stock: 'stock',
    price: 'price',
    inventory_value: 'inventory_value',
    sold_30d: 'sold_30d',
    days_of_cover: 'days_of_cover',
    last_movement_at: 'last_movement_at',
    product: 'product.name',
  };
  const sortField = SORT_MAP[sortBy] || 'stock';
  const dir = SORT_MAP[sortBy] ? sortDir : 1; // low-stock-first by default

  const pipeline = [
    ...(Object.keys(variantMatch).length ? [{ $match: variantMatch }] : []),
    { $lookup: { from: PRODUCTS, localField: 'product_id', foreignField: '_id', as: 'product' } },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    ...(Object.keys(productMatch).length ? [{ $match: productMatch }] : []),
    { $lookup: { from: CATEGORIES, localField: 'product.category_id', foreignField: '_id', as: 'cat' } },
    salesLookup(since),
    lastMovementLookup,
    {
      $addFields: {
        id: { $toString: '$_id' },
        threshold: { $ifNull: ['$low_stock_threshold', DEFAULT_LOW_STOCK] },
        inventory_value: { $multiply: ['$price', '$stock'] },
        retail_value: { $multiply: ['$original_price', '$stock'] },
        sold_30d: { $ifNull: [{ $arrayElemAt: ['$sales.qty', 0] }, 0] },
        last_movement_at: { $arrayElemAt: ['$lastMove.created_at', 0] },
        product: {
          $cond: [
            '$product',
            {
              id: { $toString: '$product._id' },
              name: '$product.name',
              image: '$product.image',
              is_available: '$product.is_available',
            },
            null,
          ],
        },
        category: {
          $let: {
            vars: { c: { $arrayElemAt: ['$cat', 0] } },
            in: { $cond: ['$$c', { id: { $toString: '$$c._id' }, name: '$$c.name' }, null] },
          },
        },
      },
    },
    {
      $addFields: {
        days_of_cover: {
          $cond: [{ $gt: ['$sold_30d', 0] }, { $divide: ['$stock', { $divide: ['$sold_30d', SALES_WINDOW_DAYS] }] }, null],
        },
        stock_status: {
          $switch: {
            branches: [
              { case: { $lte: ['$stock', 0] }, then: 'out' },
              { case: { $lte: ['$stock', '$threshold'] }, then: 'low' },
            ],
            default: 'healthy',
          },
        },
      },
    },
    ...(statusMatch ? [{ $match: statusMatch }] : []),
    {
      $facet: {
        rows: [
          { $sort: { [sortField]: dir, _id: 1 } },
          { $skip: skip },
          { $limit: pageSize },
          { $project: { sales: 0, lastMove: 0, cat: 0, __v: 0 } },
        ],
        meta: [{ $count: 'total' }],
      },
    },
  ];

  const [result] = await ProductVariant.aggregate(pipeline);
  const rows = result?.rows ?? [];
  const total = result?.meta?.[0]?.total ?? 0;
  return paginated(res, rows, total, page, pageSize);
});

/** Headline inventory KPIs for the dashboard cards. */
export const inventoryStats = asyncHandler(async (_req, res) => {
  const since = windowStart(SALES_WINDOW_DAYS);
  const flowSince = windowStart(7);

  const [valuation, flow, soldVariantIds, deadCandidates] = await Promise.all([
    // Stock valuation + status counts, evaluating each SKU against its own point.
    ProductVariant.aggregate([
      { $addFields: { threshold: { $ifNull: ['$low_stock_threshold', DEFAULT_LOW_STOCK] } } },
      {
        $group: {
          _id: null,
          totalSkus: { $sum: 1 },
          totalUnits: { $sum: '$stock' },
          inventoryValue: { $sum: { $multiply: ['$price', '$stock'] } },
          retailValue: { $sum: { $multiply: ['$original_price', '$stock'] } },
          lowStock: { $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$threshold'] }] }, 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $lte: ['$stock', 0] }, 1, 0] } },
          healthy: { $sum: { $cond: [{ $gt: ['$stock', '$threshold'] }, 1, 0] } },
          inactiveSkus: { $sum: { $cond: ['$is_available', 0, 1] } },
        },
      },
    ]),
    // Stock flow over the last 7 days from the movement ledger.
    InventoryMovement.aggregate([
      { $match: { created_at: { $gte: flowSince } } },
      {
        $group: {
          _id: null,
          movements: { $sum: 1 },
          unitsIn: { $sum: { $cond: [{ $gt: ['$change', 0] }, '$change', 0] } },
          unitsOut: { $sum: { $cond: [{ $lt: ['$change', 0] }, { $abs: '$change' }, 0] } },
        },
      },
    ]),
    // Variant ids with sales in the window (for dead-stock detection).
    OrderItem.aggregate([
      { $lookup: { from: ORDERS, localField: 'order_id', foreignField: '_id', as: 'o' } },
      { $unwind: '$o' },
      { $match: { 'o.placed_at': { $gte: since }, 'o.status': { $nin: NON_SALE_STATUSES }, variant_id: { $ne: null } } },
      { $group: { _id: '$variant_id' } },
    ]),
    ProductVariant.countDocuments({ stock: { $gt: 0 } }),
  ]);

  const soldIds = soldVariantIds.map((s) => s._id);
  // Dead stock: holding units but no sales in the window.
  const deadStock = await ProductVariant.countDocuments({ stock: { $gt: 0 }, _id: { $nin: soldIds } });

  const v = valuation[0] ?? {
    totalSkus: 0, totalUnits: 0, inventoryValue: 0, retailValue: 0,
    lowStock: 0, outOfStock: 0, healthy: 0, inactiveSkus: 0,
  };
  const f = flow[0] ?? { movements: 0, unitsIn: 0, unitsOut: 0 };

  return ok(res, {
    totalSkus: v.totalSkus,
    totalUnits: v.totalUnits,
    inventoryValue: v.inventoryValue,
    retailValue: v.retailValue,
    potentialMargin: v.retailValue - v.inventoryValue,
    lowStock: v.lowStock,
    outOfStock: v.outOfStock,
    healthy: v.healthy,
    inactiveSkus: v.inactiveSkus,
    deadStock,
    skusInStock: deadCandidates,
    movements7d: f.movements,
    unitsIn7d: f.unitsIn,
    unitsOut7d: f.unitsOut,
  });
});

/**
 * Analytics for the inventory page: status distribution, value by category,
 * 14-day stock-flow trend, demand-driven reorder suggestions, fastest movers
 * and the recent movement feed. Every figure is derived from live records.
 */
export const inventoryAnalytics = asyncHandler(async (_req, res) => {
  const since = windowStart(SALES_WINDOW_DAYS);
  const trendDays = 14;
  const trendSince = windowStart(trendDays);

  const [statusAgg, valueByCategory, trendAgg, soldAgg, lowVariants, recentRaw] = await Promise.all([
    // Status distribution with unit + value totals per bucket.
    ProductVariant.aggregate([
      { $addFields: { threshold: { $ifNull: ['$low_stock_threshold', DEFAULT_LOW_STOCK] } } },
      {
        $addFields: {
          status: {
            $switch: {
              branches: [
                { case: { $lte: ['$stock', 0] }, then: 'out' },
                { case: { $lte: ['$stock', '$threshold'] }, then: 'low' },
              ],
              default: 'healthy',
            },
          },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          units: { $sum: '$stock' },
          value: { $sum: { $multiply: ['$price', '$stock'] } },
        },
      },
    ]),
    // Inventory value tied up per category (top 8).
    ProductVariant.aggregate([
      { $lookup: { from: PRODUCTS, localField: 'product_id', foreignField: '_id', as: 'p' } },
      { $unwind: '$p' },
      {
        $group: {
          _id: '$p.category_id',
          value: { $sum: { $multiply: ['$price', '$stock'] } },
          units: { $sum: '$stock' },
          skus: { $sum: 1 },
        },
      },
      { $sort: { value: -1 } },
      { $limit: 8 },
      { $lookup: { from: CATEGORIES, localField: '_id', foreignField: '_id', as: 'cat' } },
      {
        $project: {
          _id: 0,
          id: { $toString: '$_id' },
          name: { $ifNull: [{ $arrayElemAt: ['$cat.name', 0] }, 'Uncategorized'] },
          value: 1,
          units: 1,
          skus: 1,
        },
      },
    ]),
    // Daily stock in/out from the movement ledger (last 14 days).
    InventoryMovement.aggregate([
      { $match: { created_at: { $gte: trendSince } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          in: { $sum: { $cond: [{ $gt: ['$change', 0] }, '$change', 0] } },
          out: { $sum: { $cond: [{ $lt: ['$change', 0] }, { $abs: '$change' }, 0] } },
        },
      },
    ]),
    // Units sold per variant in the window (+ denormalized labels) — feeds both
    // reorder velocity and the fastest-movers list.
    OrderItem.aggregate([
      { $lookup: { from: ORDERS, localField: 'order_id', foreignField: '_id', as: 'o' } },
      { $unwind: '$o' },
      { $match: { 'o.placed_at': { $gte: since }, 'o.status': { $nin: NON_SALE_STATUSES }, variant_id: { $ne: null } } },
      {
        $group: {
          _id: '$variant_id',
          qty: { $sum: '$quantity' },
          revenue: { $sum: '$line_total' },
          name: { $first: '$product_name' },
          label: { $first: '$variant_label' },
        },
      },
      { $sort: { qty: -1 } },
    ]),
    // Low / out-of-stock SKUs that may need reordering.
    ProductVariant.aggregate([
      { $addFields: { threshold: { $ifNull: ['$low_stock_threshold', DEFAULT_LOW_STOCK] } } },
      { $match: { $expr: { $lte: ['$stock', '$threshold'] } } },
      { $lookup: { from: PRODUCTS, localField: 'product_id', foreignField: '_id', as: 'product' } },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      { $sort: { stock: 1 } },
      { $limit: 50 },
      {
        $project: {
          _id: 0,
          id: { $toString: '$_id' },
          quantity: 1,
          stock: 1,
          threshold: 1,
          price: 1,
          product_id: { $toString: '$product_id' },
          product_name: '$product.name',
          image: '$product.image',
        },
      },
    ]),
    // Recent movement feed.
    InventoryMovement.find({})
      .sort({ created_at: -1 })
      .limit(12)
      .populate('variant_id', 'quantity product_id')
      .populate('created_by', 'email full_name')
      .lean(),
  ]);

  // Sold map for velocity lookups.
  const soldMap = new Map(soldAgg.map((s) => [String(s._id), s]));

  // Build a complete 14-day trend (fill gaps with zeros) so the chart is stable.
  const trendMap = new Map(trendAgg.map((t) => [t._id, t]));
  const movementTrend = [];
  for (let i = trendDays - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const hit = trendMap.get(key);
    movementTrend.push({ date: key, in: hit?.in ?? 0, out: hit?.out ?? 0 });
  }

  // Reorder suggestions: target ~2 weeks of demand (or the reorder point for
  // SKUs with no recent sales), capped at zero so healthy items don't appear.
  const reorderList = lowVariants
    .map((v) => {
      const sold = soldMap.get(v.id)?.qty ?? 0;
      const dailyVelocity = sold / SALES_WINDOW_DAYS;
      const demandTarget = Math.ceil(dailyVelocity * COVER_TARGET_DAYS);
      const target = Math.max(demandTarget, v.threshold);
      const suggestedQty = Math.max(target - v.stock, 0);
      const daysOfCover = dailyVelocity > 0 ? Math.round((v.stock / dailyVelocity) * 10) / 10 : null;
      return {
        id: v.id,
        product_id: v.product_id,
        product_name: v.product_name ?? '—',
        image: v.image ?? null,
        quantity: v.quantity,
        stock: v.stock,
        threshold: v.threshold,
        sold_30d: sold,
        days_of_cover: daysOfCover,
        suggested_qty: suggestedQty || v.threshold,
        status: v.stock <= 0 ? 'out' : 'low',
      };
    })
    .sort((a, b) => a.stock - b.stock);

  const topMovers = soldAgg.slice(0, 8).map((s) => ({
    id: String(s._id),
    product_name: s.name ?? '—',
    variant_label: s.label ?? null,
    sold_30d: s.qty,
    revenue: s.revenue ?? 0,
  }));

  const statusDistribution = ['healthy', 'low', 'out'].map((status) => {
    const hit = statusAgg.find((s) => s._id === status);
    return { status, count: hit?.count ?? 0, units: hit?.units ?? 0, value: hit?.value ?? 0 };
  });

  const recentMovements = recentRaw.map((m) => ({
    id: String(m._id),
    variant_id: m.variant_id ? String(m.variant_id._id ?? m.variant_id) : null,
    variant_label: m.variant_id?.quantity ?? null,
    change: m.change,
    resulting_stock: m.resulting_stock,
    reason: m.reason,
    note: m.note,
    created_at: m.created_at,
    created_by_email: m.created_by?.email ?? null,
  }));

  return ok(res, { statusDistribution, valueByCategory, movementTrend, reorderList, topMovers, recentMovements });
});

/* -------------------------------- Mutations -------------------------------- */

// Resolve the stock delta from an adjustment payload supporting add/remove
// (change) or absolute set (set). Returns the signed change to apply.
function resolveDelta(variant, body) {
  if (body.set !== undefined && body.set !== null) return Number(body.set) - variant.stock;
  return Number(body.change ?? 0);
}

/**
 * Adjust a single SKU's stock and append to the movement ledger. Optionally
 * updates the SKU's reorder point in the same call.
 */
export const adjustStock = asyncHandler(async (req, res) => {
  const variant = await ProductVariant.findById(req.params.id);
  if (!variant) throw ApiError.notFound('variant not found');

  const { reason = 'manual', note, reference, low_stock_threshold } = req.body;
  const delta = resolveDelta(variant, req.body);
  const newStock = Math.max(0, variant.stock + delta);

  variant.stock = newStock;
  if (low_stock_threshold !== undefined && low_stock_threshold !== null) {
    variant.low_stock_threshold = Math.max(0, Number(low_stock_threshold));
  }
  await variant.save();

  if (delta !== 0) {
    await InventoryMovement.create({
      variant_id: variant._id,
      change: delta,
      resulting_stock: newStock,
      reason,
      note: note ?? null,
      reference: reference ?? null,
      created_by: req.admin?._id ?? null,
    });
  }

  // Surface a low-stock alert so it shows up in the notifications feed.
  const threshold = variant.low_stock_threshold ?? DEFAULT_LOW_STOCK;
  if (newStock <= threshold) {
    const product = await Product.findById(variant.product_id).select('name');
    notify(
      'stock',
      newStock <= 0 ? 'SKU out of stock' : 'SKU running low',
      `${product?.name ?? 'A product'} (${variant.quantity}) is at ${newStock} unit${newStock === 1 ? '' : 's'}.`,
      '/inventory'
    );
  }

  await logActivity(req, 'adjust_stock', 'variant', variant.id, { change: delta, newStock, reason });
  return ok(res, { id: variant.id, stock: newStock, low_stock_threshold: variant.low_stock_threshold });
});

/**
 * Apply the same adjustment to many SKUs at once (bulk restock / stocktake).
 * Records a movement per SKU so the ledger stays accurate.
 */
export const bulkAdjustStock = asyncHandler(async (req, res) => {
  const { ids, mode = 'add', amount = 0, reason = 'restock', note } = req.body;
  const variants = await ProductVariant.find({ _id: { $in: ids } });
  if (!variants.length) throw ApiError.notFound('no matching SKUs');

  const movements = [];
  const ops = [];
  for (const variant of variants) {
    let delta;
    if (mode === 'set') delta = Number(amount) - variant.stock;
    else if (mode === 'remove') delta = -Math.abs(Number(amount));
    else delta = Math.abs(Number(amount));
    const newStock = Math.max(0, variant.stock + delta);
    if (delta === 0) continue;
    ops.push({ updateOne: { filter: { _id: variant._id }, update: { $set: { stock: newStock } } } });
    movements.push({
      variant_id: variant._id,
      change: delta,
      resulting_stock: newStock,
      reason,
      note: note ?? null,
      created_by: req.admin?._id ?? null,
    });
  }

  if (ops.length) await ProductVariant.bulkWrite(ops);
  if (movements.length) await InventoryMovement.insertMany(movements);

  await logActivity(req, 'bulk_adjust_stock', 'variant', null, { ids, mode, amount, reason, applied: ops.length });
  return ok(res, { updated: ops.length });
});

/** Movement ledger for a single SKU (most recent first). */
export const variantMovements = asyncHandler(async (req, res) => {
  const rows = await InventoryMovement.find({ variant_id: req.params.id })
    .sort({ created_at: -1 })
    .limit(100)
    .populate('created_by', 'email full_name')
    .lean();

  return ok(
    res,
    rows.map((m) => ({
      id: String(m._id),
      variant_id: String(m.variant_id),
      change: m.change,
      resulting_stock: m.resulting_stock,
      reason: m.reason,
      reference: m.reference,
      note: m.note,
      created_by_email: m.created_by?.email ?? null,
      created_at: m.created_at,
    }))
  );
});
