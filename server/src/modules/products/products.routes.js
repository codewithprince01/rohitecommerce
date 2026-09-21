import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  listProducts, productStats, getProduct, createProduct, updateProduct, deleteProduct,
  bulkAvailability, bulkDelete,
} from './products.controller.js';

const variantSchema = z.object({
  id: z.string().optional(),
  quantity: z.string().min(1),
  price: z.number().nonnegative(),
  original_price: z.number().nonnegative().optional(),
  discount: z.number().optional(),
  stock: z.number().int().optional(),
  is_available: z.boolean().optional(),
});

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().nullish(),
  image: z.string().nullish(),
  category_id: z.string().min(1),
  subcategory_id: z.string().min(1),
  brand_id: z.string().min(1),
  is_available: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  variants: z.array(variantSchema).optional(),
});

const router = Router();

// Public storefront endpoints
router.get('/', listProducts);

// Must be declared before '/:id', otherwise Express matches "stats" as a
// product id and the admin KPI cards get a 404 instead of their numbers.
router.get('/stats', requireAuth, requirePermission('products.view'), productStats);

router.get('/:id', getProduct);

// Admin-only endpoints require authentication
router.use(requireAuth);

router.post('/', requirePermission('products.create'), validate(productSchema), createProduct);
router.patch('/:id', requirePermission('products.update'), validate(productSchema.partial()), updateProduct);
router.delete('/:id', requirePermission('products.delete'), deleteProduct);
router.post('/bulk/availability', requirePermission('products.update'),
  validate(z.object({ ids: z.array(z.string()).min(1), is_available: z.boolean() })), bulkAvailability);
router.post('/bulk/delete', requirePermission('products.delete'),
  validate(z.object({ ids: z.array(z.string()).min(1) })), bulkDelete);

export default router;
