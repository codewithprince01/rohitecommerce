import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  listBanners, bannerStats, getBanner, createBanner, updateBanner,
  deleteBanner, reorderBanners, bulkAction, publicBanners,
} from './banners.controller.js';

const LINK_TYPES = ['none', 'category', 'subcategory', 'brand', 'product', 'url'];

const bannerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().nullish(),
  image: z.string().nullish(),
  bg_color: z.string().optional(),
  link_type: z.enum(LINK_TYPES).optional(),
  link_value: z.string().nullish(),
  position: z.string().optional(),
  sort_order: z.number().int().optional(),
  starts_at: z.string().nullish(),
  ends_at: z.string().nullish(),
  is_active: z.boolean().optional(),
});

const router = Router();

// Public storefront endpoint — must be registered before the auth gate.
router.get('/public', publicBanners);

router.use(requireAuth);

// Static routes before the `/:id` param route.
router.get('/', requirePermission('banners.view'), listBanners);
router.get('/stats', requirePermission('banners.view'), bannerStats);
router.post('/reorder', requirePermission('banners.manage'),
  validate(z.object({ items: z.array(z.object({ id: z.string(), sort_order: z.number().int() })).min(1) })),
  reorderBanners);
router.post('/bulk', requirePermission('banners.manage'),
  validate(z.object({ ids: z.array(z.string()).min(1), action: z.enum(['activate', 'deactivate', 'delete']) })),
  bulkAction);

router.get('/:id', requirePermission('banners.view'), getBanner);
router.post('/', requirePermission('banners.manage'), validate(bannerSchema), createBanner);
router.patch('/:id', requirePermission('banners.manage'), validate(bannerSchema.partial()), updateBanner);
router.delete('/:id', requirePermission('banners.manage'), deleteBanner);

export default router;
