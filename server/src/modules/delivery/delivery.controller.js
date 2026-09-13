import { DeliveryZone } from '../../models/Operations.js';
import { Address } from '../../models/Customer.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { parseListParams, searchFilter, equalityFilters } from '../../utils/query.js';
import { logActivity } from '../../services/activity.service.js';

const ADDRESSES = Address.collection.name;

const SORTABLE = new Set(['name', 'fee', 'min_order', 'eta_minutes', 'created_at', 'pincode_count', 'customers_covered']);

// Per-zone serviceability rollup: how many customer addresses (and distinct
// customers) fall inside this zone's pincodes. Real coverage, from real data.
const coverageLookup = {
  $lookup: {
    from: ADDRESSES,
    let: { pins: { $ifNull: ['$pincodes', []] } },
    pipeline: [
      { $match: { $expr: { $in: ['$pincode', '$$pins'] } } },
      { $group: { _id: null, addresses: { $sum: 1 }, customers: { $addToSet: '$customer_id' } } },
      { $project: { _id: 0, addresses: 1, customers: { $size: '$customers' } } },
    ],
    as: 'cov',
  },
};

/** Paginated delivery-zone list enriched with real customer coverage. */
export const listDeliveryZones = asyncHandler(async (req, res) => {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseListParams(req.query);
  const match = {
    ...searchFilter(search, ['name']),
    ...equalityFilters(req.query, ['is_active']),
  };
  const sortField = SORTABLE.has(sortBy) ? sortBy : 'name';

  const pipeline = [
    { $match: match },
    { $addFields: { pincode_count: { $size: { $ifNull: ['$pincodes', []] } } } },
    coverageLookup,
    {
      $addFields: {
        id: { $toString: '$_id' },
        addresses_covered: { $ifNull: [{ $arrayElemAt: ['$cov.addresses', 0] }, 0] },
        customers_covered: { $ifNull: [{ $arrayElemAt: ['$cov.customers', 0] }, 0] },
      },
    },
    {
      $facet: {
        rows: [
          { $sort: { [sortField]: sortDir, _id: 1 } },
          { $skip: skip },
          { $limit: pageSize },
          { $project: { cov: 0, __v: 0 } },
        ],
        meta: [{ $count: 'total' }],
      },
    },
  ];

  const [result] = await DeliveryZone.aggregate(pipeline);
  const rows = result?.rows ?? [];
  const total = result?.meta?.[0]?.total ?? 0;
  return paginated(res, rows, total, page, pageSize);
});

/**
 * Delivery KPIs + serviceability insights: zone counts, fee/ETA averages,
 * pincode coverage, customers reachable, plus uncovered customer demand and
 * pincodes assigned to more than one zone (a config ambiguity worth flagging).
 */
export const deliveryStats = asyncHandler(async (_req, res) => {
  const [zoneAgg, allPincodeAgg, activePincodeAgg, addressPincodeAgg] = await Promise.all([
    DeliveryZone.aggregate([
      {
        $group: {
          _id: null,
          totalZones: { $sum: 1 },
          activeZones: { $sum: { $cond: ['$is_active', 1, 0] } },
          freeDeliveryZones: { $sum: { $cond: [{ $ne: ['$free_above', null] }, 1, 0] } },
          avgFee: { $avg: '$fee' },
          avgEta: { $avg: '$eta_minutes' },
        },
      },
    ]),
    // Each pincode → how many zones list it (duplicates are >1).
    DeliveryZone.aggregate([
      { $unwind: '$pincodes' },
      { $group: { _id: '$pincodes', zones: { $sum: 1 } } },
    ]),
    // Pincodes served by an active zone.
    DeliveryZone.aggregate([
      { $match: { is_active: true } },
      { $unwind: '$pincodes' },
      { $group: { _id: '$pincodes' } },
    ]),
    // Customer address demand per pincode.
    Address.aggregate([
      { $group: { _id: '$pincode', addresses: { $sum: 1 }, customers: { $addToSet: '$customer_id' } } },
    ]),
  ]);

  const z = zoneAgg[0] ?? { totalZones: 0, activeZones: 0, freeDeliveryZones: 0, avgFee: 0, avgEta: 0 };
  const activeSet = new Set(activePincodeAgg.map((p) => p._id));

  // Pincodes where customers live but no active zone delivers — lost demand.
  const uncovered = addressPincodeAgg
    .filter((p) => p._id && !activeSet.has(p._id))
    .map((p) => ({ pincode: p._id, addresses: p.addresses, customers: p.customers.length }))
    .sort((a, b) => b.customers - a.customers);

  // Pincodes claimed by more than one zone — ambiguous fee/ETA at checkout.
  const duplicates = allPincodeAgg
    .filter((p) => p.zones > 1)
    .map((p) => ({ pincode: p._id, zones: p.zones }))
    .sort((a, b) => b.zones - a.zones);

  // Distinct customers reachable by any active zone.
  const customersCovered = activeSet.size
    ? (await Address.distinct('customer_id', { pincode: { $in: [...activeSet] } })).length
    : 0;

  return ok(res, {
    totalZones: z.totalZones,
    activeZones: z.activeZones,
    inactiveZones: z.totalZones - z.activeZones,
    freeDeliveryZones: z.freeDeliveryZones,
    avgFee: Math.round((z.avgFee ?? 0) * 100) / 100,
    avgEta: Math.round(z.avgEta ?? 0),
    pincodesCovered: allPincodeAgg.length,
    activePincodesCovered: activeSet.size,
    customersCovered,
    uncoveredPincodeCount: uncovered.length,
    duplicatePincodeCount: duplicates.length,
    uncoveredSample: uncovered.slice(0, 8),
    duplicateSample: duplicates.slice(0, 8),
  });
});

// Normalize an incoming zone payload (dedupe + trim pincodes, coerce numbers).
function buildZoneDoc(input) {
  const doc = {
    name: input.name?.trim(),
    pincodes: Array.isArray(input.pincodes)
      ? [...new Set(input.pincodes.map((p) => String(p).trim()).filter(Boolean))]
      : undefined,
    fee: input.fee != null ? Number(input.fee) : undefined,
    min_order: input.min_order != null ? Number(input.min_order) : undefined,
    free_above: input.free_above != null ? Number(input.free_above) : null,
    eta_minutes: input.eta_minutes != null ? Number(input.eta_minutes) : undefined,
    is_active: input.is_active,
  };
  Object.keys(doc).forEach((k) => doc[k] === undefined && delete doc[k]);
  return doc;
}

export const createDeliveryZone = asyncHandler(async (req, res) => {
  const zone = await DeliveryZone.create(buildZoneDoc(req.body));
  await logActivity(req, 'create', 'delivery_zone', zone.id, { name: zone.name });
  return created(res, { id: zone.id });
});

export const updateDeliveryZone = asyncHandler(async (req, res) => {
  const zone = await DeliveryZone.findByIdAndUpdate(req.params.id, buildZoneDoc(req.body), {
    new: true,
    runValidators: true,
  });
  if (!zone) throw ApiError.notFound('delivery zone not found');
  await logActivity(req, 'update', 'delivery_zone', zone.id, { name: zone.name });
  return ok(res, { id: zone.id });
});

export const deleteDeliveryZone = asyncHandler(async (req, res) => {
  const zone = await DeliveryZone.findByIdAndDelete(req.params.id);
  if (!zone) throw ApiError.notFound('delivery zone not found');
  await logActivity(req, 'delete', 'delivery_zone', req.params.id, { name: zone.name });
  return ok(res, { success: true });
});

export const bulkSetActive = asyncHandler(async (req, res) => {
  const { ids, is_active } = req.body;
  await DeliveryZone.updateMany({ _id: { $in: ids } }, { is_active });
  await logActivity(req, 'bulk_update', 'delivery_zone', null, { ids, is_active });
  return ok(res, { success: true });
});

export const bulkDelete = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  await DeliveryZone.deleteMany({ _id: { $in: ids } });
  await logActivity(req, 'bulk_delete', 'delivery_zone', null, { ids });
  return ok(res, { success: true });
});
