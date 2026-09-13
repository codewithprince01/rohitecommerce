import { ActivityLog } from '../../models/Operations.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, paginated } from '../../utils/ApiResponse.js';
import { parseListParams, searchFilter, equalityFilters } from '../../utils/query.js';

const SORTABLE = new Set(['created_at', 'action', 'entity_type', 'admin_email']);
const DAY_MS = 86400000;

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

/** Immutable audit trail of admin actions — read-only. */
export const listActivity = asyncHandler(async (req, res) => {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseListParams(req.query);
  const dateRange = dateRangeFilter(req.query.from, req.query.to);
  const filter = {
    ...searchFilter(search, ['action', 'admin_email', 'entity_type', 'entity_id']),
    ...equalityFilters(req.query, ['action', 'entity_type', 'admin_email']),
    ...(dateRange ? { created_at: dateRange } : {}),
  };
  const sortField = SORTABLE.has(sortBy) ? sortBy : 'created_at';

  const [rows, total] = await Promise.all([
    ActivityLog.find(filter)
      .sort({ [sortField]: sortDir, _id: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean({ virtuals: true }),
    ActivityLog.countDocuments(filter),
  ]);
  return paginated(res, rows.map((r) => ({ ...r, id: String(r._id) })), total, page, pageSize);
});

/** Audit KPIs + top actions/entities/actors breakdowns. */
export const activityStats = asyncHandler(async (_req, res) => {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const week = new Date(Date.now() - 7 * DAY_MS);

  const [facet] = await ActivityLog.aggregate([
    {
      $facet: {
        total: [{ $count: 'count' }],
        today: [{ $match: { created_at: { $gte: dayStart } } }, { $count: 'count' }],
        last7: [{ $match: { created_at: { $gte: week } } }, { $count: 'count' }],
        actors: [{ $match: { admin_email: { $ne: null } } }, { $group: { _id: '$admin_email' } }, { $count: 'count' }],
        byAction: [
          { $group: { _id: '$action', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ],
        byEntity: [
          { $match: { entity_type: { $ne: null } } },
          { $group: { _id: '$entity_type', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ],
        topAdmins: [
          { $match: { admin_email: { $ne: null } } },
          { $group: { _id: '$admin_email', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ],
      },
    },
  ]);

  return ok(res, {
    total: facet.total[0]?.count ?? 0,
    today: facet.today[0]?.count ?? 0,
    last7: facet.last7[0]?.count ?? 0,
    activeAdmins: facet.actors[0]?.count ?? 0,
    byAction: facet.byAction.map((a) => ({ action: a._id, count: a.count })),
    byEntity: facet.byEntity.map((e) => ({ entity_type: e._id, count: e.count })),
    topAdmins: facet.topAdmins.map((a) => ({ admin_email: a._id, count: a.count })),
  });
});

/** Distinct values for the page's filter dropdowns — driven by real data. */
export const activityFilters = asyncHandler(async (_req, res) => {
  const [actions, entities, admins] = await Promise.all([
    ActivityLog.distinct('action'),
    ActivityLog.distinct('entity_type'),
    ActivityLog.distinct('admin_email'),
  ]);
  return ok(res, {
    actions: actions.filter(Boolean).sort(),
    entities: entities.filter(Boolean).sort(),
    admins: admins.filter(Boolean).sort(),
  });
});
