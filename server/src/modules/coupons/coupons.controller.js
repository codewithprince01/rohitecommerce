import mongoose from 'mongoose';
import { Coupon } from '../../models/Marketing.js';
import { Order } from '../../models/Order.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { parseListParams, searchFilter, equalityFilters } from '../../utils/query.js';
import { logActivity } from '../../services/activity.service.js';

const ORDERS = Order.collection.name;
// Orders in these states didn't actually consume the coupon's value.
const NON_REDEEMED_STATUSES = ['cancelled', 'returned'];

// Live coupon lifecycle status, derived from active flag + dates + usage cap.
// Evaluated in aggregations against $$NOW so it never drifts from real time.
const STATUS_EXPR = {
  $switch: {
    branches: [
      { case: { $eq: ['$is_active', false] }, then: 'disabled' },
      { case: { $and: [{ $ne: ['$ends_at', null] }, { $lt: ['$ends_at', '$$NOW'] }] }, then: 'expired' },
      { case: { $and: [{ $ne: ['$usage_limit', null] }, { $gte: ['$used_count', '$usage_limit'] }] }, then: 'exhausted' },
      { case: { $and: [{ $ne: ['$starts_at', null] }, { $gt: ['$starts_at', '$$NOW'] }] }, then: 'scheduled' },
    ],
    default: 'active',
  },
};

// Per-coupon redemption rollup from real orders (count, discount given, revenue).
const usageLookup = {
  $lookup: {
    from: ORDERS,
    let: { cid: '$_id' },
    pipeline: [
      { $match: { $expr: { $eq: ['$coupon_id', '$$cid'] }, status: { $nin: NON_REDEEMED_STATUSES } } },
      {
        $group: {
          _id: null,
          redemptions: { $sum: 1 },
          total_discount: { $sum: '$discount' },
          revenue: { $sum: '$total' },
        },
      },
    ],
    as: 'usage',
  },
};

const SORTABLE = new Set([
  'code', 'value', 'min_order', 'used_count', 'redemptions', 'total_discount', 'created_at', 'ends_at', 'starts_at',
]);

/**
 * Paginated coupon list. Each row carries its live lifecycle status and its
 * real redemption metrics (redemptions / discount given / revenue) computed
 * from orders — sortable on the computed fields via a single aggregation.
 */
export const listCoupons = asyncHandler(async (req, res) => {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseListParams(req.query);
  const match = {
    ...searchFilter(search, ['code', 'description']),
    ...equalityFilters(req.query, ['type', 'is_active']),
  };

  const status = req.query.status;
  const statusMatch = status ? { status } : null;

  const sortField = SORTABLE.has(sortBy) ? sortBy : 'created_at';

  const pipeline = [
    { $match: match },
    usageLookup,
    {
      $addFields: {
        id: { $toString: '$_id' },
        status: STATUS_EXPR,
        redemptions: { $ifNull: [{ $arrayElemAt: ['$usage.redemptions', 0] }, 0] },
        total_discount: { $ifNull: [{ $arrayElemAt: ['$usage.total_discount', 0] }, 0] },
        revenue: { $ifNull: [{ $arrayElemAt: ['$usage.revenue', 0] }, 0] },
      },
    },
    ...(statusMatch ? [{ $match: statusMatch }] : []),
    {
      $facet: {
        rows: [
          { $sort: { [sortField]: sortDir, _id: 1 } },
          { $skip: skip },
          { $limit: pageSize },
          { $project: { usage: 0, __v: 0 } },
        ],
        meta: [{ $count: 'total' }],
      },
    },
  ];

  const [result] = await Coupon.aggregate(pipeline);
  const rows = result?.rows ?? [];
  const total = result?.meta?.[0]?.total ?? 0;
  return paginated(res, rows, total, page, pageSize);
});

/** Headline coupon KPIs + lifecycle breakdown for the dashboard cards. */
export const couponStats = asyncHandler(async (_req, res) => {
  const soon = new Date(Date.now() + 7 * 86400000);
  const now = new Date();

  const [statusAgg, redemptionAgg, expiringSoon] = await Promise.all([
    Coupon.aggregate([
      { $addFields: { status: STATUS_EXPR } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { coupon_id: { $ne: null }, status: { $nin: NON_REDEEMED_STATUSES } } },
      {
        $group: {
          _id: null,
          totalRedemptions: { $sum: 1 },
          totalDiscountGiven: { $sum: '$discount' },
          couponRevenue: { $sum: '$total' },
        },
      },
    ]),
    Coupon.countDocuments({ is_active: true, ends_at: { $ne: null, $gte: now, $lte: soon } }),
  ]);

  const byStatus = Object.fromEntries(statusAgg.map((s) => [s._id, s.count]));
  const totalCoupons = statusAgg.reduce((sum, s) => sum + s.count, 0);
  const r = redemptionAgg[0] ?? { totalRedemptions: 0, totalDiscountGiven: 0, couponRevenue: 0 };

  return ok(res, {
    totalCoupons,
    activeCoupons: byStatus.active ?? 0,
    scheduledCoupons: byStatus.scheduled ?? 0,
    expiredCoupons: byStatus.expired ?? 0,
    disabledCoupons: byStatus.disabled ?? 0,
    exhaustedCoupons: byStatus.exhausted ?? 0,
    expiringSoon,
    totalRedemptions: r.totalRedemptions,
    totalDiscountGiven: r.totalDiscountGiven,
    couponRevenue: r.couponRevenue,
    avgDiscount: r.totalRedemptions ? Math.round((r.totalDiscountGiven / r.totalRedemptions) * 100) / 100 : 0,
  });
});

/** Single coupon with its live status + redemption rollup. */
export const getCoupon = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('coupon not found');
  const [doc] = await Coupon.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
    usageLookup,
    {
      $addFields: {
        id: { $toString: '$_id' },
        status: STATUS_EXPR,
        redemptions: { $ifNull: [{ $arrayElemAt: ['$usage.redemptions', 0] }, 0] },
        total_discount: { $ifNull: [{ $arrayElemAt: ['$usage.total_discount', 0] }, 0] },
        revenue: { $ifNull: [{ $arrayElemAt: ['$usage.revenue', 0] }, 0] },
      },
    },
    { $project: { usage: 0, __v: 0 } },
  ]);
  if (!doc) throw ApiError.notFound('coupon not found');
  return ok(res, doc);
});

// Normalize an incoming coupon payload to storable values.
function buildCouponDoc(input) {
  const doc = {
    code: input.code ? input.code.toUpperCase().trim() : undefined,
    description: input.description ?? null,
    type: input.type,
    value: input.value != null ? Number(input.value) : undefined,
    min_order: input.min_order != null ? Number(input.min_order) : undefined,
    max_discount: input.max_discount != null ? Number(input.max_discount) : null,
    usage_limit: input.usage_limit != null ? Number(input.usage_limit) : null,
    starts_at: input.starts_at ? new Date(input.starts_at) : null,
    ends_at: input.ends_at ? new Date(input.ends_at) : null,
    is_active: input.is_active,
  };
  // Drop undefined keys so PATCH doesn't clobber unspecified fields.
  Object.keys(doc).forEach((k) => doc[k] === undefined && delete doc[k]);
  return doc;
}

// Guard against contradictory date windows and out-of-range percentages.
function validateCoupon(doc) {
  if (doc.starts_at && doc.ends_at && doc.ends_at < doc.starts_at) {
    throw ApiError.badRequest('End date must be after the start date');
  }
  if (doc.type === 'percent' && doc.value != null && (doc.value <= 0 || doc.value > 100)) {
    throw ApiError.badRequest('Percentage value must be between 1 and 100');
  }
}

export const createCoupon = asyncHandler(async (req, res) => {
  const doc = buildCouponDoc(req.body);
  validateCoupon(doc);
  const coupon = await Coupon.create(doc);
  await logActivity(req, 'create', 'coupon', coupon.id, { code: coupon.code });
  return created(res, { id: coupon.id });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const doc = buildCouponDoc(req.body);
  // Merge against current values so cross-field validation is accurate on PATCH.
  const current = await Coupon.findById(req.params.id);
  if (!current) throw ApiError.notFound('coupon not found');
  validateCoupon({ ...current.toObject(), ...doc });

  const coupon = await Coupon.findByIdAndUpdate(req.params.id, doc, { new: true, runValidators: true });
  await logActivity(req, 'update', 'coupon', coupon.id, { code: coupon.code });
  return ok(res, { id: coupon.id });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw ApiError.notFound('coupon not found');
  await logActivity(req, 'delete', 'coupon', req.params.id, { code: coupon.code });
  return ok(res, { success: true });
});

export const bulkSetActive = asyncHandler(async (req, res) => {
  const { ids, is_active } = req.body;
  await Coupon.updateMany({ _id: { $in: ids } }, { is_active });
  await logActivity(req, 'bulk_update', 'coupon', null, { ids, is_active });
  return ok(res, { success: true });
});

export const bulkDelete = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  await Coupon.deleteMany({ _id: { $in: ids } });
  await logActivity(req, 'bulk_delete', 'coupon', null, { ids });
  return ok(res, { success: true });
});
