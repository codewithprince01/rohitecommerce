import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { getSettings, updateSettings, getPublicSettings } from './settings.controller.js';

// Unknown keys are stripped by zod (non-strict), so junk can't reach the store.
const updateSchema = z.object({
  general: z
    .object({
      store_name: z.string().max(120).optional(),
      currency: z.string().max(8).optional(),
      currency_symbol: z.string().max(4).optional(),
      support_email: z.string().email().or(z.literal('')).optional(),
      support_phone: z.string().max(40).optional(),
      address: z.string().max(400).optional(),
    })
    .optional(),
  checkout: z
    .object({
      tax_rate: z.number().min(0).max(100).optional(),
      default_delivery_fee: z.number().nonnegative().optional(),
      free_delivery_threshold: z.number().nonnegative().optional(),
      min_order_value: z.number().nonnegative().optional(),
      cod_enabled: z.boolean().optional(),
    })
    .optional(),
  operations: z
    .object({
      store_online: z.boolean().optional(),
      order_notice: z.string().max(300).optional(),
      low_stock_alerts: z.boolean().optional(),
    })
    .optional(),
});

const router = Router();

// Public, no-auth subset for the storefront.
router.get('/public', getPublicSettings);

router.use(requireAuth);
router.get('/', requirePermission('settings.view'), getSettings);
router.patch('/', requirePermission('settings.manage'), validate(updateSchema), updateSettings);

export default router;
