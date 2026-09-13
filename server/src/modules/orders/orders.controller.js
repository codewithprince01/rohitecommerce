import { Order, OrderItem, OrderStatusHistory, ORDER_STATUSES } from '../../models/Order.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { parseListParams, searchFilter, equalityFilters } from '../../utils/query.js';
import { logActivity, notify } from '../../services/activity.service.js';

// Allowed forward/lateral status transitions — server is the source of truth.
const TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

// Orders that don't count toward realized revenue / active fulfilment.
const VOID_STATUSES = ['cancelled', 'returned'];
// Fields the orders table is allowed to sort by.
const SORTABLE = new Set(['placed_at', 'total', 'order_number', 'status', 'payment_status', 'created_at']);

function generateOrderNumber() {
  const ts = Date.now().toString().slice(-6);
  const rnd = Math.floor(Math.random() * 900 + 100);
  return `GRO${ts}${rnd}`;
}

// Build a { $gte, $lte } range on placed_at from optional from/to query params.
function dateRangeFilter(from, to) {
  const range = {};
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) range.$gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) {
      // Inclusive end-of-day so a single from=to=date covers the whole day.
      d.setHours(23, 59, 59, 999);
      range.$lte = d;
    }
  }
  return Object.keys(range).length ? range : null;
}

export const listOrders = asyncHandler(async (req, res) => {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseListParams(req.query);
  const dateRange = dateRangeFilter(req.query.from, req.query.to);
  const filter = {
    ...searchFilter(search, ['order_number', 'coupon_code']),
    ...equalityFilters(req.query, ['status', 'payment_status', 'payment_method', 'customer_id']),
    ...(dateRange ? { placed_at: dateRange } : {}),
  };
  const sortField = SORTABLE.has(sortBy) ? sortBy : 'placed_at';
  const [rows, total] = await Promise.all([
    Order.find(filter)
      .sort({ [sortField]: sortDir, _id: 1 })
      .skip(skip)
      .limit(pageSize)
      .populate('customer', 'id name email phone')
      .lean({ virtuals: true }),
    Order.countDocuments(filter),
  ]);
  return paginated(res, rows.map((r) => ({ ...r, id: String(r._id) })), total, page, pageSize);
});

/** Order KPIs for the dashboard cards on the Orders page. */
export const orderStats = asyncHandler(async (_req, res) => {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const [facet] = await Order.aggregate([
    {
      $facet: {
        total: [{ $count: 'count' }],
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        realized: [
          { $match: { status: { $nin: VOID_STATUSES } } },
          { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
        ],
        paid: [
          { $match: { status: { $nin: VOID_STATUSES }, payment_status: 'paid' } },
          { $group: { _id: null, revenue: { $sum: '$total' } } },
        ],
        unpaid: [
          {
            $match: {
              status: { $nin: VOID_STATUSES },
              payment_status: { $in: ['pending', 'failed'] },
            },
          },
          { $group: { _id: null, orders: { $sum: 1 }, amount: { $sum: '$total' } } },
        ],
        today: [
          { $match: { placed_at: { $gte: dayStart }, status: { $nin: VOID_STATUSES } } },
          { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
        ],
      },
    },
  ]);

  const statusBreakdown = {
    pending: 0, confirmed: 0, packed: 0, out_for_delivery: 0,
    delivered: 0, cancelled: 0, returned: 0,
  };
  for (const row of facet.byStatus) {
    if (row._id in statusBreakdown) statusBreakdown[row._id] = row.count;
  }

  const totalOrders = facet.total[0]?.count ?? 0;
  const realized = facet.realized[0] ?? { orders: 0, revenue: 0 };
  const unpaid = facet.unpaid[0] ?? { orders: 0, amount: 0 };
  const today = facet.today[0] ?? { orders: 0, revenue: 0 };

  return ok(res, {
    totalOrders,
    statusBreakdown,
    pending: statusBreakdown.pending,
    processing: statusBreakdown.confirmed + statusBreakdown.packed,
    outForDelivery: statusBreakdown.out_for_delivery,
    delivered: statusBreakdown.delivered,
    cancelled: statusBreakdown.cancelled,
    returned: statusBreakdown.returned,
    // Active = anything not yet delivered and not voided.
    openOrders:
      statusBreakdown.pending +
      statusBreakdown.confirmed +
      statusBreakdown.packed +
      statusBreakdown.out_for_delivery,
    revenue: realized.revenue,
    paidRevenue: facet.paid[0]?.revenue ?? 0,
    avgOrderValue: realized.orders ? realized.revenue / realized.orders : 0,
    unpaidOrders: unpaid.orders,
    unpaidRevenue: unpaid.amount,
    todayOrders: today.orders,
    todayRevenue: today.revenue,
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer')
    .populate('items')
    .lean({ virtuals: true });
  if (!order) throw ApiError.notFound('order not found');
  return ok(res, { ...order, id: String(order._id) });
});

export const getOrderHistory = asyncHandler(async (req, res) => {
  const history = await OrderStatusHistory.find({ order_id: req.params.id })
    .sort({ created_at: -1 })
    .lean({ virtuals: true });
  return ok(res, history.map((h) => ({ ...h, id: String(h._id) })));
});

export const createOrder = asyncHandler(async (req, res) => {
  const input = req.body;
  const items = input.items || [];
  const subtotal = items.reduce((s, i) => s + Number(i.line_total), 0);
  const total = subtotal - Number(input.discount || 0) + Number(input.delivery_fee || 0) + Number(input.tax || 0);

  const order = await Order.create({
    order_number: generateOrderNumber(),
    customer_id: input.customer_id || null,
    status: 'pending',
    payment_status: input.payment_status || 'pending',
    payment_method: input.payment_method || 'cod',
    subtotal,
    discount: Number(input.discount || 0),
    delivery_fee: Number(input.delivery_fee || 0),
    tax: Number(input.tax || 0),
    total,
    notes: input.notes ?? null,
    delivery_address: input.delivery_address ?? null,
  });

  if (items.length) {
    await OrderItem.insertMany(items.map((i) => ({ ...i, order_id: order._id })));
  }
  await OrderStatusHistory.create({ order_id: order._id, status: 'pending' });
  await notify('order', `New order ${order.order_number}`, `Total ₹${total}`, `/orders/${order.id}`);
  await logActivity(req, 'create', 'order', order.id, { total });
  return created(res, { id: order.id });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('order not found');

  if (!ORDER_STATUSES.includes(status)) {
    throw ApiError.badRequest(`Invalid order status: ${status}`);
  }

  const prevStatus = order.status;
  order.status = status;
  await order.save();
  await OrderStatusHistory.create({
    order_id: order._id,
    status,
    note: note ?? (prevStatus !== status ? `Status updated from ${prevStatus.replace(/_/g, ' ')} to ${status.replace(/_/g, ' ')}` : null),
    changed_by: req.admin?._id ?? null,
  });
  await notify('order', `Order ${order.order_number} → ${status.replace(/_/g, ' ')}`, note, `/orders/${order.id}`);
  await logActivity(req, 'update_status', 'order', order.id, { order_number: order.order_number, from: prevStatus, status });
  return ok(res, { id: order.id, status });
});

export const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { ids, status, note } = req.body;
  if (!ORDER_STATUSES.includes(status)) {
    throw ApiError.badRequest(`Invalid order status: ${status}`);
  }

  const orders = await Order.find({ _id: { $in: ids } });

  const updated = [];
  const skipped = [];
  for (const order of orders) {
    if (status !== order.status) {
      const prevStatus = order.status;
      order.status = status;
      await order.save();
      await OrderStatusHistory.create({
        order_id: order._id,
        status,
        note: note ?? `Status updated from ${prevStatus.replace(/_/g, ' ')} to ${status.replace(/_/g, ' ')}`,
        changed_by: req.admin?._id ?? null,
      });
    }
    updated.push(order.id);
  }

  if (updated.length) {
    await notify('order', `${updated.length} orders → ${status.replace(/_/g, ' ')}`, note, '/orders');
    await logActivity(req, 'bulk_update_status', 'order', null, { ids: updated, status });
  }
  return ok(res, { updated: updated.length, skipped });
});

export const updatePayment = asyncHandler(async (req, res) => {
  const { payment_status } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.id, { payment_status }, { new: true });
  if (!order) throw ApiError.notFound('order not found');
  await logActivity(req, 'update_payment', 'order', order.id, { payment_status });
  return ok(res, { id: order.id, payment_status });
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) throw ApiError.notFound('order not found');
  await Promise.all([
    OrderItem.deleteMany({ order_id: req.params.id }),
    OrderStatusHistory.deleteMany({ order_id: req.params.id }),
  ]);
  await logActivity(req, 'delete', 'order', req.params.id);
  return ok(res, { success: true });
});

export { ORDER_STATUSES };
