import { AdminUser } from '../../models/AdminUser.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { parseListParams, searchFilter, equalityFilters } from '../../utils/query.js';
import { logActivity } from '../../services/activity.service.js';

const DAY_MS = 86400000;
const SORTABLE = new Set(['full_name', 'email', 'role', 'created_at', 'last_login_at', 'is_active']);
// Fields safe to return — the password hash is select:false but we project
// explicitly so nothing sensitive can ever leak.
const SAFE_FIELDS = 'email full_name role is_active last_login_at created_at';

const isSelf = (req, id) => String(req.admin._id) === String(id);

// Count active super-admins, optionally excluding one account (the one being
// changed) — used to refuse the last-super-admin lockout.
const activeSuperAdmins = (excludeId) =>
  AdminUser.countDocuments({ role: 'super_admin', is_active: true, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
const totalSuperAdmins = (excludeId) =>
  AdminUser.countDocuments({ role: 'super_admin', ...(excludeId ? { _id: { $ne: excludeId } } : {}) });

/** Paginated admin list (password never included). */
export const listAdmins = asyncHandler(async (req, res) => {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseListParams(req.query);
  const filter = {
    ...searchFilter(search, ['email', 'full_name']),
    ...equalityFilters(req.query, ['role', 'is_active']),
  };
  const sortField = SORTABLE.has(sortBy) ? sortBy : 'created_at';

  const [docs, total] = await Promise.all([
    AdminUser.find(filter).select(SAFE_FIELDS).sort({ [sortField]: sortDir, _id: 1 }).skip(skip).limit(pageSize).lean(),
    AdminUser.countDocuments(filter),
  ]);

  const rows = docs.map((d) => ({
    id: String(d._id),
    email: d.email,
    full_name: d.full_name,
    role: d.role,
    is_active: d.is_active,
    last_login_at: d.last_login_at,
    created_at: d.created_at,
  }));
  return paginated(res, rows, total, page, pageSize);
});

/** Admin team KPIs + role/status breakdown. */
export const adminStats = asyncHandler(async (_req, res) => {
  const recentSince = new Date(Date.now() - 7 * DAY_MS);
  const [byRole, totals, recentlyActive] = await Promise.all([
    AdminUser.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    AdminUser.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$is_active', 1, 0] } },
          neverLoggedIn: { $sum: { $cond: [{ $eq: ['$last_login_at', null] }, 1, 0] } },
        },
      },
    ]),
    AdminUser.countDocuments({ last_login_at: { $gte: recentSince } }),
  ]);

  const roleMap = Object.fromEntries(byRole.map((r) => [r._id, r.count]));
  const t = totals[0] ?? { total: 0, active: 0, neverLoggedIn: 0 };

  return ok(res, {
    totalAdmins: t.total,
    activeAdmins: t.active,
    disabledAdmins: t.total - t.active,
    superAdmins: roleMap.super_admin ?? 0,
    managers: roleMap.manager ?? 0,
    staff: roleMap.staff ?? 0,
    recentlyActive,
    neverLoggedIn: t.neverLoggedIn,
  });
});

export const createAdmin = asyncHandler(async (req, res) => {
  const { email, password, full_name, role } = req.body;
  // Model pre-save hook hashes the password.
  const admin = new AdminUser({ email: email.toLowerCase().trim(), password, full_name: full_name ?? '', role });
  await admin.save();
  await logActivity(req, 'create', 'admin_user', admin.id, { email: admin.email, role: admin.role });
  return created(res, { id: admin.id });
});

export const updateAdmin = asyncHandler(async (req, res) => {
  const target = await AdminUser.findById(req.params.id);
  if (!target) throw ApiError.notFound('admin not found');

  const { full_name, role, is_active } = req.body;
  const self = isSelf(req, target._id);

  // Self-lockout guards.
  if (self && role !== undefined && role !== target.role) {
    throw ApiError.badRequest("You can't change your own role");
  }
  if (self && is_active === false) {
    throw ApiError.badRequest("You can't disable your own account");
  }

  // Protect the last active super-admin from demotion / disabling.
  const demoting = target.role === 'super_admin' && role !== undefined && role !== 'super_admin';
  const disabling = target.role === 'super_admin' && is_active === false;
  if (demoting || disabling) {
    if ((await activeSuperAdmins(target._id)) === 0) {
      throw ApiError.badRequest('At least one active super admin must remain');
    }
  }

  if (full_name !== undefined) target.full_name = full_name;
  if (role !== undefined) target.role = role;
  if (is_active !== undefined) target.is_active = is_active;
  await target.save();

  await logActivity(req, 'update', 'admin_user', target.id, { role: target.role, is_active: target.is_active });
  return ok(res, { id: target.id });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const target = await AdminUser.findById(req.params.id).select('+password');
  if (!target) throw ApiError.notFound('admin not found');
  target.password = req.body.newPassword; // hashed by pre-save hook
  await target.save();
  await logActivity(req, 'reset_password', 'admin_user', target.id, { email: target.email });
  return ok(res, { success: true });
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  const target = await AdminUser.findById(req.params.id);
  if (!target) throw ApiError.notFound('admin not found');

  if (isSelf(req, target._id)) throw ApiError.badRequest("You can't delete your own account");
  if (target.role === 'super_admin' && (await totalSuperAdmins(target._id)) === 0) {
    throw ApiError.badRequest('Cannot delete the last super admin');
  }

  await target.deleteOne();
  await logActivity(req, 'delete', 'admin_user', target.id, { email: target.email });
  return ok(res, { success: true });
});
