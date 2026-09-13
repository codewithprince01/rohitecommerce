import { Banner } from '../../models/Marketing.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { parseListParams, searchFilter, equalityFilters } from '../../utils/query.js';
import { logActivity } from '../../services/activity.service.js';

const SORTABLE = new Set(['sort_order', 'title', 'position', 'created_at', 'is_active']);

// Normalize an incoming banner payload: blank strings → null, dates cast safely.
function buildBannerDoc(input) {
  const toDate = (v) => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const doc = {
    title: input.title,
    subtitle: input.subtitle ? input.subtitle : null,
    image: input.image ? input.image : null,
    bg_color: input.bg_color || 'bg-primary-500',
    link_type: input.link_type || 'none',
    link_value: input.link_type && input.link_type !== 'none' && input.link_value ? input.link_value : null,
    position: input.position || 'home_hero',
    sort_order: Number(input.sort_order ?? 0),
    starts_at: toDate(input.starts_at),
    ends_at: toDate(input.ends_at),
    is_active: input.is_active ?? true,
  };
  return doc;
}

// Derived lifecycle state used by the UI + stats (never stored).
function lifecycle(b, now = Date.now()) {
  if (!b.is_active) return 'hidden';
  if (b.starts_at && new Date(b.starts_at).getTime() > now) return 'scheduled';
  if (b.ends_at && new Date(b.ends_at).getTime() < now) return 'expired';
  return 'live';
}

export const listBanners = asyncHandler(async (req, res) => {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseListParams(req.query);
  const filter = {
    ...searchFilter(search, ['title', 'subtitle']),
    ...equalityFilters(req.query, ['position', 'is_active', 'link_type']),
  };
  const sortField = SORTABLE.has(sortBy) ? sortBy : 'sort_order';

  const [rows, total] = await Promise.all([
    Banner.find(filter)
      .sort({ [sortField]: sortDir, _id: 1 })
      .skip(skip)
      .limit(pageSize)
      .lean({ virtuals: true }),
    Banner.countDocuments(filter),
  ]);

  const now = Date.now();
  return paginated(
    res,
    rows.map((b) => ({ ...b, id: String(b._id), status: lifecycle(b, now) })),
    total,
    page,
    pageSize
  );
});

export const bannerStats = asyncHandler(async (_req, res) => {
  const all = await Banner.find({}).lean({ virtuals: true });
  const now = Date.now();
  const stats = {
    total: all.length,
    live: 0,
    scheduled: 0,
    expired: 0,
    hidden: 0,
    byPosition: {},
  };
  for (const b of all) {
    const state = lifecycle(b, now);
    stats[state] += 1;
    stats.byPosition[b.position] = (stats.byPosition[b.position] ?? 0) + 1;
  }
  return ok(res, stats);
});

export const getBanner = asyncHandler(async (req, res) => {
  const b = await Banner.findById(req.params.id).lean({ virtuals: true });
  if (!b) throw ApiError.notFound('banner not found');
  return ok(res, { ...b, id: String(b._id), status: lifecycle(b) });
});

export const createBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.create(buildBannerDoc(req.body));
  await logActivity(req, 'create', 'banner', banner.id, { title: banner.title });
  return created(res, banner.toJSON());
});

export const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, buildBannerDoc(req.body), {
    new: true,
    runValidators: true,
  });
  if (!banner) throw ApiError.notFound('banner not found');
  await logActivity(req, 'update', 'banner', banner.id, { title: banner.title });
  return ok(res, banner.toJSON());
});

export const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) throw ApiError.notFound('banner not found');
  await logActivity(req, 'delete', 'banner', req.params.id, { title: banner.title });
  return ok(res, { success: true });
});

// Persist a new display order: [{ id, sort_order }, ...].
export const reorderBanners = asyncHandler(async (req, res) => {
  const { items } = req.body;
  await Promise.all(
    items.map((it) => Banner.findByIdAndUpdate(it.id, { sort_order: Number(it.sort_order) }))
  );
  await logActivity(req, 'reorder', 'banner', null, { count: items.length });
  return ok(res, { success: true, count: items.length });
});

export const bulkAction = asyncHandler(async (req, res) => {
  const { ids, action } = req.body;
  if (action === 'delete') {
    await Banner.deleteMany({ _id: { $in: ids } });
  } else {
    await Banner.updateMany({ _id: { $in: ids } }, { is_active: action === 'activate' });
  }
  await logActivity(req, `bulk_${action}`, 'banner', null, { ids });
  return ok(res, { success: true, count: ids.length });
});

/**
 * Public storefront endpoint (no auth): only banners that are active AND within
 * their schedule window, sorted by position then sort_order. Optional ?position=.
 */
export const publicBanners = asyncHandler(async (req, res) => {
  const now = new Date();
  const filter = {
    is_active: true,
    $and: [
      { $or: [{ starts_at: null }, { starts_at: { $lte: now } }] },
      { $or: [{ ends_at: null }, { ends_at: { $gte: now } }] },
    ],
  };
  if (req.query.position) filter.position = req.query.position;

  const banners = await Banner.find(filter)
    .sort({ position: 1, sort_order: 1, _id: 1 })
    .lean({ virtuals: true });

  return ok(
    res,
    banners.map((b) => ({
      id: String(b._id),
      title: b.title,
      subtitle: b.subtitle,
      image: b.image,
      bg_color: b.bg_color,
      link_type: b.link_type,
      link_value: b.link_value,
      position: b.position,
      sort_order: b.sort_order,
    }))
  );
});
