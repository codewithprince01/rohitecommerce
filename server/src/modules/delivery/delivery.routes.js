import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  listDeliveryZones, deliveryStats, createDeliveryZone, updateDeliveryZone, deleteDeliveryZone,
  bulkSetActive, bulkDelete,
} from './delivery.controller.js';

const zoneSchema = z.object({
  name: z.string().min(1).max(80),
  pincodes: z.array(z.string()).optional(),
  fee: z.number().nonnegative().optional(),
  min_order: z.number().nonnegative().optional(),
  free_above: z.number().nonnegative().nullish(),
  eta_minutes: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
});

const router = Router();
router.use(requireAuth);

router.get('/', requirePermission('delivery.view'), listDeliveryZones);
router.get('/stats', requirePermission('delivery.view'), deliveryStats);
router.post('/bulk/active', requirePermission('delivery.manage'),
  validate(z.object({ ids: z.array(z.string()).min(1), is_active: z.boolean() })), bulkSetActive);
router.post('/bulk/delete', requirePermission('delivery.manage'),
  validate(z.object({ ids: z.array(z.string()).min(1) })), bulkDelete);
router.post('/', requirePermission('delivery.manage'), validate(zoneSchema), createDeliveryZone);
router.patch('/:id', requirePermission('delivery.manage'), validate(zoneSchema.partial()), updateDeliveryZone);
router.delete('/:id', requirePermission('delivery.manage'), deleteDeliveryZone);

export default router;
