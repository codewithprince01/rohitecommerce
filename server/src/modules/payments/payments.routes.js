import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  listPayments, paymentStats, listMethods, updateMethod, updateTransaction,
} from './payments.controller.js';

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const methodSchema = z.object({
  is_enabled: z.boolean().optional(),
  name: z.string().min(1).optional(),
  sort_order: z.number().int().optional(),
  config: z.record(z.any()).optional(),
});

const router = Router();
router.use(requireAuth);

// Static routes before any param routes.
router.get('/', requirePermission('payments.view'), listPayments);
router.get('/stats', requirePermission('payments.view'), paymentStats);
router.get('/methods', requirePermission('payments.view'), listMethods);
router.patch('/methods/:id', requirePermission('payments.manage'), validate(methodSchema), updateMethod);
router.patch('/transactions/:orderId', requirePermission('payments.manage'),
  validate(z.object({ payment_status: z.enum(PAYMENT_STATUSES) })), updateTransaction);

export default router;
