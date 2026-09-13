import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  listCoupons, couponStats, getCoupon, createCoupon, updateCoupon, deleteCoupon,
  bulkSetActive, bulkDelete,
} from './coupons.controller.js';

const couponSchema = z.object({
  code: z.string().min(2).max(40),
  description: z.string().max(300).nullish(),
  type: z.enum(['percent', 'fixed']),
  value: z.number().positive(),
  min_order: z.number().nonnegative().optional(),
  max_discount: z.number().nonnegative().nullish(),
  usage_limit: z.number().int().positive().nullish(),
  starts_at: z.string().nullish(),
  ends_at: z.string().nullish(),
  is_active: z.boolean().optional(),
});

const router = Router();
router.use(requireAuth);

// Static routes before the dynamic /:id so they aren't shadowed.
router.get('/', requirePermission('coupons.view'), listCoupons);
router.get('/stats', requirePermission('coupons.view'), couponStats);
router.post('/bulk/active', requirePermission('coupons.manage'),
  validate(z.object({ ids: z.array(z.string()).min(1), is_active: z.boolean() })), bulkSetActive);
router.post('/bulk/delete', requirePermission('coupons.manage'),
  validate(z.object({ ids: z.array(z.string()).min(1) })), bulkDelete);

router.get('/:id', requirePermission('coupons.view'), getCoupon);
router.post('/', requirePermission('coupons.manage'), validate(couponSchema), createCoupon);
router.patch('/:id', requirePermission('coupons.manage'), validate(couponSchema.partial()), updateCoupon);
router.delete('/:id', requirePermission('coupons.manage'), deleteCoupon);

export default router;
