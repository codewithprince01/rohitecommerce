import { Order, PAYMENT_STATUSES } from '../../models/Order.js';
import { PaymentMethod } from '../../models/Operations.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, paginated } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { parseListParams, searchFilter, equalityFilters } from '../../utils/query.js';
import { logActivity } from '../../services/activity.service.js';

// Orders that don't represent realized/expected revenue.
const VOID_STATUSES = ['cancelled', 'returned'];
const SORTABLE = new Set(['placed_at', 'total', 'order_number', 'payment_status', 'payment_method']);

function dateRangeFilter(from, to) {
  const range = {};
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) range.$gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      range.$lte = d;
    }
  }
  return Object.keys(range).length ? range : null;
}

/**
 * Payment transactions = orders projected as payment records. This is the real
 * reconciliation ledger — one row per order with its amount, method and
 * payment state. No synthetic transaction store.
 */
export const listPayments = asyncHandler(async (req, res) => {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseListParams(req.query);
  const dateRange = dateRangeFilter(req.query.from, req.query.to);
  const filter = {
    ...searchFilter(search, ['order_number']),
    ...equalityFilters(req.query, ['payment_status', 'payment_method', 'status']),
    ...(dateRange ? { placed_at: dateRange } : {}),
  };
  const sortField = SORTABLE.has(sortBy) ? sortBy : 'placed_at';

  const [rows, total] = await Promise.all([
    Order.find(filter)
      .sort({ [sortField]: sortDir, _id: 1 })
      .skip(skip)
      .limit(pageSize)
      .populate('customer', 'id name email')
      .lean({ virtuals: true }),
    Order.countDocuments(filter),
  ]);

  const data = rows.map((o) => ({
    id: String(o._id),
    order_id: String(o._id),
    order_number: o.order_number,
    customer: o.customer ? { ...o.customer, id: String(o.customer._id) } : null,
    amount: o.total,
    payment_status: o.payment_status,
    payment_method: o.payment_method,
    order_status: o.status,
    placed_at: o.placed_at,
  }));
  return paginated(res, data, total, page, pageSize);
});

/** Payment KPIs + by-method/by-status breakdowns, all from real orders. */
export const paymentStats = asyncHandler(async (_req, res) => {
  const [facet] = await Order.aggregate([
    {
      $facet: {
        byStatus: [
          { $match: { status: { $nin: VOID_STATUSES } } },
          { $group: { _id: '$payment_status', orders: { $sum: 1 }, amount: { $sum: '$total' } } },
        ],
        byMethod: [
          { $match: { status: { $nin: VOID_STATUSES } } },
          {
            $group: {
              _id: '$payment_method',
              orders: { $sum: 1 },
              amount: { $sum: '$total' },
              collected: { $sum: { $cond: [{ $eq: ['$payment_status', 'paid'] }, '$total', 0] } },
            },
          },
        ],
        codDue: [
          {
            $match: {
              status: { $nin: VOID_STATUSES },
              payment_method: 'cod',
              payment_status: { $in: ['pending', 'failed'] },
            },
          },
          { $group: { _id: null, orders: { $sum: 1 }, amount: { $sum: '$total' } } },
        ],
        refunded: [
          { $match: { payment_status: 'refunded' } },
          { $group: { _id: null, orders: { $sum: 1 }, amount: { $sum: '$total' } } },
        ],
      },
    },
  ]);

  const byStatusMap = {};
  for (const s of facet.byStatus) byStatusMap[s._id] = { orders: s.orders, amount: s.amount };
  const grab = (k) => byStatusMap[k] || { orders: 0, amount: 0 };

  const paid = grab('paid');
  const pending = grab('pending');
  const failed = grab('failed');
  const refunded = facet.refunded[0] || { orders: 0, amount: 0 };
  const codDue = facet.codDue[0] || { orders: 0, amount: 0 };

  const grossSales = facet.byStatus.reduce((s, x) => s + x.amount, 0);
  const grossOrders = facet.byStatus.reduce((s, x) => s + x.orders, 0);

  const byMethod = facet.byMethod
    .map((m) => ({ method: m._id, orders: m.orders, amount: m.amount, collected: m.collected }))
    .sort((a, b) => b.amount - a.amount);

  return ok(res, {
    collected: paid.amount,
    collectedOrders: paid.orders,
    pending: pending.amount,
    pendingOrders: pending.orders,
    failed: failed.amount,
    failedOrders: failed.orders,
    refunded: refunded.amount,
    refundedOrders: refunded.orders,
    codDue: codDue.amount,
    codDueOrders: codDue.orders,
    grossSales,
    grossOrders,
    outstanding: pending.amount + failed.amount,
    collectionRate: grossSales > 0 ? (paid.amount / grossSales) * 100 : 0,
    byMethod,
    byStatus: byStatusMap,
  });
});

/* ----------------------------- Payment methods --------------------------- */

export const listMethods = asyncHandler(async (_req, res) => {
  const methods = await PaymentMethod.find({}).sort({ sort_order: 1 }).lean({ virtuals: true });
  return ok(res, methods.map((m) => ({ ...m, id: String(m._id) })));
});

export const updateMethod = asyncHandler(async (req, res) => {
  const { is_enabled, name, sort_order, config } = req.body;
  const update = {};
  if (is_enabled !== undefined) update.is_enabled = is_enabled;
  if (name !== undefined) update.name = name;
  if (sort_order !== undefined) update.sort_order = sort_order;
  if (config !== undefined) update.config = config;

  const method = await PaymentMethod.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!method) throw ApiError.notFound('payment method not found');
  await logActivity(req, 'update', 'payment_method', method.id, update);
  return ok(res, method.toJSON());
});

/* --------------------------- Transaction update -------------------------- */

// Reconcile a single transaction: set the order's payment status.
export const updateTransaction = asyncHandler(async (req, res) => {
  const { payment_status } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.orderId,
    { payment_status },
    { new: true }
  );
  if (!order) throw ApiError.notFound('order not found');
  await logActivity(req, 'update_payment', 'order', order.id, { payment_status });
  return ok(res, { id: order.id, order_id: order.id, payment_status: order.payment_status });
});

export { PAYMENT_STATUSES };
