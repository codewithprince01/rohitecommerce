import mongoose from 'mongoose';
import { Customer, Address } from '../../models/Customer.js';
import { Order } from '../../models/Order.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, paginated } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { parseListParams, searchFilter, equalityFilters } from '../../utils/query.js';
import { logActivity } from '../../services/activity.service.js';

const ORDERS = Order.collection.name;
const VOID_STATUSES = ['cancelled', 'returned'];
const DAY_MS = 86400000;
// Base + order-rollup fields the table may sort on.
const SORTABLE = new Set(['name', 'created_at', 'orders_count', 'total_spent', 'last_order_at']);

/**
 * List customers enriched with real order rollups (order count, lifetime spend,
 * last order date) computed in one aggregation, so the table can show and sort
 * on segment data without N+1 queries — and so segment filters are accurate.
 */
export const listCustomers = asyncHandler(async (req, res) => {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseListParams(req.query);
  const match = {
    ...searchFilter(search, ['name', 'email', 'phone']),
    ...equalityFilters(req.query, ['is_blocked']),
  };

  const sortField = SORTABLE.has(sortBy) ? sortBy : 'created_at';
  const since30 = new Date(Date.now() - 30 * DAY_MS);

  // Segment filters operate on the computed rollups.
  const segment = req.query.segment;
  const segmentMatch =
    segment === 'with_orders'
      ? { orders_count: { $gt: 0 } }
      : segment === 'inactive'
      ? { orders_count: { $lte: 0 } }
      : segment === 'repeat'
      ? { valid_count: { $gte: 2 } }
      : segment === 'new'
      ? { created_at: { $gte: since30 } }
      : null;

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: ORDERS,
        let: { cid: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$customer_id', '$$cid'] } } },
          { $project: { total: 1, status: 1, placed_at: 1 } },
        ],
        as: 'orders',
      },
    },
    {
      $addFields: {
        id: { $toString: '$_id' },
        orders_count: { $size: '$orders' },
        last_order_at: { $max: '$orders.placed_at' },
        valid_orders: {
          $filter: {
            input: '$orders',
            as: 'o',
            cond: { $not: [{ $in: ['$$o.status', VOID_STATUSES] }] },
          },
        },
      },
    },
    {
      $addFields: {
        total_spent: { $sum: '$valid_orders.total' },
        valid_count: { $size: '$valid_orders' },
      },
    },
    { $project: { orders: 0, valid_orders: 0, __v: 0 } },
    ...(segmentMatch ? [{ $match: segmentMatch }] : []),
    {
      $facet: {
        rows: [
          { $sort: { [sortField]: sortDir, _id: 1 } },
          { $skip: skip },
          { $limit: pageSize },
        ],
        meta: [{ $count: 'total' }],
      },
    },
  ];

  const [result] = await Customer.aggregate(pipeline);
  const rows = result?.rows ?? [];
  const total = result?.meta?.[0]?.total ?? 0;
  return paginated(res, rows, total, page, pageSize);
});

/** Customer-base KPIs for the dashboard cards on the Customers page. */
export const customerStats = asyncHandler(async (_req, res) => {
  const since30 = new Date(Date.now() - 30 * DAY_MS);

  const [base, newCount, orderAgg] = await Promise.all([
    Customer.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          blocked: { $sum: { $cond: ['$is_blocked', 1, 0] } },
        },
      },
    ]),
    Customer.countDocuments({ created_at: { $gte: since30 } }),
    Order.aggregate([
      { $match: { customer_id: { $ne: null }, status: { $nin: VOID_STATUSES } } },
      { $group: { _id: '$customer_id', spent: { $sum: '$total' }, cnt: { $sum: 1 } } },
    ]),
  ]);

  const total = base[0]?.total ?? 0;
  const blocked = base[0]?.blocked ?? 0;
  const withOrders = orderAgg.length;
  const repeat = orderAgg.filter((o) => o.cnt >= 2).length;
  const totalLifetimeValue = orderAgg.reduce((s, o) => s + Number(o.spent), 0);

  return ok(res, {
    totalCustomers: total,
    activeCustomers: total - blocked,
    blockedCustomers: blocked,
    newCustomers: newCount,
    withOrders,
    repeatCustomers: repeat,
    totalLifetimeValue,
    avgLifetimeValue: withOrders ? totalLifetimeValue / withOrders : 0,
  });
});

/** Single customer with addresses, full order history and lifetime stats. */
export const getCustomerDetail = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id).lean({ virtuals: true });
  if (!customer) throw ApiError.notFound('customer not found');
  customer.id = String(customer._id);

  const [addresses, orders] = await Promise.all([
    Address.find({ customer_id: req.params.id }).sort({ is_default: -1, created_at: -1 }).lean({ virtuals: true }),
    Order.find({ customer_id: req.params.id }).sort({ placed_at: -1 }).lean({ virtuals: true }),
  ]);

  const valid = orders.filter((o) => !VOID_STATUSES.includes(o.status));
  const lifetimeValue = valid.reduce((s, o) => s + Number(o.total), 0);

  return ok(res, {
    customer,
    addresses: addresses.map((a) => ({ ...a, id: String(a._id) })),
    orders: orders.map((o) => ({ ...o, id: String(o._id) })),
    stats: {
      totalOrders: orders.length,
      validOrders: valid.length,
      lifetimeValue,
      avgOrderValue: valid.length ? lifetimeValue / valid.length : 0,
      firstOrderAt: orders.length ? orders[orders.length - 1].placed_at : null,
      lastOrderAt: orders.length ? orders[0].placed_at : null,
    },
  });
});

/* ------------------------------ Mutations ------------------------------ */

// Normalize blank email/phone to null so we don't store empty strings.
export function normalizeCustomer(body) {
  const out = { ...body };
  if ('email' in out) out.email = out.email ? String(out.email).trim().toLowerCase() : null;
  if ('phone' in out) out.phone = out.phone ? String(out.phone).trim() : null;
  if ('notes' in out) out.notes = out.notes ? out.notes : null;
  return out;
}

export const bulkBlock = asyncHandler(async (req, res) => {
  const { ids, is_blocked } = req.body;
  await Customer.updateMany({ _id: { $in: ids } }, { is_blocked });
  await logActivity(req, is_blocked ? 'bulk_block' : 'bulk_unblock', 'customer', null, { ids });
  return ok(res, { success: true, count: ids.length });
});

export const bulkDelete = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  await Customer.deleteMany({ _id: { $in: ids } });
  await Address.deleteMany({ customer_id: { $in: ids } });
  await logActivity(req, 'bulk_delete', 'customer', null, { ids });
  return ok(res, { success: true, count: ids.length });
});

export { mongoose };
