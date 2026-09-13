import { verifyAccessToken } from '../modules/auth/token.service.js';
import { AdminUser } from '../models/AdminUser.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { can } from '../config/permissions.js';

// Require a valid access token; attaches the live admin record to req.admin.
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized('Missing access token');

  const payload = verifyAccessToken(token);
  const admin = await AdminUser.findById(payload.sub).select('-password');
  if (!admin) throw ApiError.unauthorized('Account no longer exists');
  if (!admin.is_active) throw ApiError.forbidden('This account has been disabled');

  req.admin = admin;
  next();
});

// Require one or more permissions (all must be held).
export const requirePermission = (...permissions) =>
  (req, _res, next) => {
    if (!req.admin) return next(ApiError.unauthorized());
    const role = req.admin.role;
    const missing = permissions.filter((p) => !can(role, p));
    if (missing.length) {
      return next(ApiError.forbidden(`Missing permission: ${missing.join(', ')}`));
    }
    next();
  };

// Restrict to specific roles (e.g. super_admin only for admin management).
export const requireRole = (...roles) =>
  (req, _res, next) => {
    if (!req.admin) return next(ApiError.unauthorized());
    if (!roles.includes(req.admin.role)) {
      return next(ApiError.forbidden('Insufficient role'));
    }
    next();
  };
