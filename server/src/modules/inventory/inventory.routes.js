import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  listInventory,
  inventoryStats,
  inventoryAnalytics,
  adjustStock,
  bulkAdjustStock,
  variantMovements,
} from './inventory.controller.js';

const MOVEMENT_REASONS = ['manual', 'restock', 'sale', 'correction', 'return', 'damage', 'stocktake', 'transfer'];

// Single-SKU adjustment: either a signed delta (`change`) or an absolute `set`,
// optionally updating the SKU's reorder point in the same call.
const adjustSchema = z
  .object({
    change: z.number().optional(),
    set: z.number().int().nonnegative().optional(),
    reason: z.enum(MOVEMENT_REASONS).optional(),
    note: z.string().max(500).nullish(),
    reference: z.string().max(120).nullish(),
    low_stock_threshold: z.number().int().nonnegative().optional(),
  })
  .refine(
    (b) => b.change !== undefined || b.set !== undefined || b.low_stock_threshold !== undefined,
    { message: 'Provide a change, a set value, or a threshold update' }
  );

const bulkAdjustSchema = z.object({
  ids: z.array(z.string()).min(1),
  mode: z.enum(['add', 'remove', 'set']).optional(),
  amount: z.number().int(),
  reason: z.enum(MOVEMENT_REASONS).optional(),
  note: z.string().max(500).nullish(),
});

const router = Router();
router.use(requireAuth);

router.get('/', requirePermission('inventory.view'), listInventory);
router.get('/stats', requirePermission('inventory.view'), inventoryStats);
router.get('/analytics', requirePermission('inventory.view'), inventoryAnalytics);
router.get('/:id/movements', requirePermission('inventory.view'), variantMovements);
router.post('/:id/adjust', requirePermission('inventory.adjust'), validate(adjustSchema), adjustStock);
router.post('/bulk/adjust', requirePermission('inventory.adjust'), validate(bulkAdjustSchema), bulkAdjustStock);

export default router;
