import { AdminUser } from '../../models/AdminUser.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';
import { permissionsFor } from '../../config/permissions.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './token.service.js';
import { logActivity } from '../../services/activity.service.js';

function authPayload(admin) {
  return {
    admin: admin.toJSON(),
    permissions: permissionsFor(admin.role),
  };
}

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await AdminUser.findOne({ email: email.toLowerCase() }).select('+password');
  if (!admin || !(await admin.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!admin.is_active) throw ApiError.forbidden('This account has been disabled');

  admin.last_login_at = new Date();
  await admin.save();

  const accessToken = signAccessToken(admin);
  const refreshToken = signRefreshToken(admin);
  await logActivity({ admin }, 'login', 'admin', admin.id);

  return ok(res, { ...authPayload(admin), accessToken, refreshToken });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  return ok(res, authPayload(req.admin));
});

// POST /api/auth/refresh
export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const payload = verifyRefreshToken(refreshToken);
  const admin = await AdminUser.findById(payload.sub);
  if (!admin || !admin.is_active) throw ApiError.unauthorized('Session is no longer valid');

  return ok(res, {
    accessToken: signAccessToken(admin),
    refreshToken: signRefreshToken(admin),
  });
});

// POST /api/auth/logout (stateless JWT — client discards tokens; we just audit)
export const logout = asyncHandler(async (req, res) => {
  await logActivity(req, 'logout', 'admin', req.admin.id);
  return ok(res, { success: true });
});

// POST /api/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = await AdminUser.findById(req.admin.id).select('+password');
  if (!(await admin.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  admin.password = newPassword;
  await admin.save();
  await logActivity(req, 'change_password', 'admin', admin.id);
  return ok(res, { success: true });
});
