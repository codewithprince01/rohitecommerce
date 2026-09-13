import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  listAdmins, adminStats, createAdmin, updateAdmin, resetPassword, deleteAdmin,
} from './admins.controller.js';

const ROLES = ['super_admin', 'manager', 'staff'];

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  full_name: z.string().max(120).optional(),
  role: z.enum(ROLES),
});

const updateSchema = z.object({
  full_name: z.string().max(120).optional(),
  role: z.enum(ROLES).optional(),
  is_active: z.boolean().optional(),
});

const resetSchema = z.object({ newPassword: z.string().min(6).max(100) });

const router = Router();
router.use(requireAuth);

// admins.view / admins.manage are super-admin-only in the permission matrix.
router.get('/', requirePermission('admins.view'), listAdmins);
router.get('/stats', requirePermission('admins.view'), adminStats);
router.post('/', requirePermission('admins.manage'), validate(createSchema), createAdmin);
router.post('/:id/reset-password', requirePermission('admins.manage'), validate(resetSchema), resetPassword);
router.patch('/:id', requirePermission('admins.manage'), validate(updateSchema), updateAdmin);
router.delete('/:id', requirePermission('admins.manage'), deleteAdmin);

export default router;
