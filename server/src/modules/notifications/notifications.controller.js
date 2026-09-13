import { Notification } from '../../models/Operations.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, paginated } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { parseListParams, searchFilter, equalityFilters } from '../../utils/query.js';
import { logActivity } from '../../services/activity.service.js';

const TYPES = ['info', 'order', 'stock', 'customer', 'system'];
const SORTABLE = new Set(['created_at', 'type', 'is_read', 'title']);

export const listNotifications = asyncHandler(async (req, res) => {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseListParams(req.query);
  const filter = {
    ...searchFilter(search, ['title', 'body']),
    ...equalityFilters(req.query, ['type', 'is_read']),
  };
  const sortField = SORTABLE.has(sortBy) ? sortBy : 'created_at';

  const [rows, total] = await Promise.all([
    Notification.find(filter)
      .sort({ [sortField]: sortDir, _id: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean({ virtuals: true }),
    Notification.countDocuments(filter),
  ]);
  return paginated(res, rows.map((n) => ({ ...n, id: String(n._id) })), total, page, pageSize);
});

export const notificationStats = asyncHandler(async (_req, res) => {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const [facet] = await Notification.aggregate([
    {
      $facet: {
        total: [{ $count: 'count' }],
        unread: [{ $match: { is_read: false } }, { $count: 'count' }],
        today: [{ $match: { created_at: { $gte: dayStart } } }, { $count: 'count' }],
        byType: [{ $group: { _id: '$type', count: { $sum: 1 } } }],
        unreadByType: [{ $match: { is_read: false } }, { $group: { _id: '$type', count: { $sum: 1 } } }],
      },
    },
  ]);

  const byType = {};
  const unreadByType = {};
  for (const t of TYPES) {
    byType[t] = 0;
    unreadByType[t] = 0;
  }
  for (const r of facet.byType) if (r._id in byType) byType[r._id] = r.count;
  for (const r of facet.unreadByType) if (r._id in unreadByType) unreadByType[r._id] = r.count;

  return ok(res, {
    total: facet.total[0]?.count ?? 0,
    unread: facet.unread[0]?.count ?? 0,
    today: facet.today[0]?.count ?? 0,
    byType,
    unreadByType,
  });
});

export const unreadCount = asyncHandler(async (_req, res) => {
  const count = await Notification.countDocuments({ is_read: false });
  return ok(res, { count });
});

// Mark a single notification read/unread (body.is_read defaults to true).
export const markRead = asyncHandler(async (req, res) => {
  const is_read = req.body?.is_read ?? true;
  const n = await Notification.findByIdAndUpdate(req.params.id, { is_read }, { new: true });
  if (!n) throw ApiError.notFound('notification not found');
  return ok(res, { id: n.id, is_read: n.is_read });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany({ is_read: false }, { is_read: true });
  await logActivity(req, 'mark_all_read', 'notification', null, { count: result.modifiedCount });
  return ok(res, { success: true, count: result.modifiedCount ?? 0 });
});

export const bulkAction = asyncHandler(async (req, res) => {
  const { ids, action } = req.body;
  if (action === 'delete') {
    await Notification.deleteMany({ _id: { $in: ids } });
  } else {
    await Notification.updateMany({ _id: { $in: ids } }, { is_read: action === 'read' });
  }
  await logActivity(req, `bulk_${action}`, 'notification', null, { ids });
  return ok(res, { success: true, count: ids.length });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const n = await Notification.findByIdAndDelete(req.params.id);
  if (!n) throw ApiError.notFound('notification not found');
  return ok(res, { success: true });
});

// Housekeeping: delete every already-read notification.
export const clearRead = asyncHandler(async (req, res) => {
  const result = await Notification.deleteMany({ is_read: true });
  await logActivity(req, 'clear_read', 'notification', null, { count: result.deletedCount });
  return ok(res, { success: true, count: result.deletedCount ?? 0 });
});
