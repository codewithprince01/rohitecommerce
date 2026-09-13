import { Router } from 'express';
import { z } from 'zod';
import slugify from 'slugify';
import { Category, Subcategory, Brand } from '../../models/Catalog.js';
import { crudController } from '../../utils/crudController.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  catalogStats,
  listCategories,
  listSubcategories,
  listBrands,
  removeCategory,
  removeSubcategory,
  removeBrand,
} from './categories.controller.js';

const slug = (name) => slugify(name, { lower: true, strict: true });

const categories = crudController(Category, {
  entity: 'category',
  searchFields: ['name', 'slug'],
  defaultSort: { sort_order: 1 },
  transformWrite: (b) => ({ ...b, slug: b.slug || (b.name ? slug(b.name) : undefined) }),
});
const subcategories = crudController(Subcategory, {
  entity: 'subcategory',
  searchFields: ['name', 'slug'],
  filterFields: ['category_id'],
  populate: 'category',
  defaultSort: { sort_order: 1 },
  transformWrite: (b) => ({ ...b, slug: b.slug || (b.name ? slug(b.name) : undefined) }),
});
const brands = crudController(Brand, {
  entity: 'brand',
  searchFields: ['name', 'slug'],
  filterFields: ['subcategory_id'],
  transformWrite: (b) => ({ ...b, slug: b.slug || (b.name ? slug(b.name) : undefined) }),
});

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  image: z.string().nullish(),
  bg_color: z.string().optional(),
  sort_order: z.number().int().optional(),
});
const subcategorySchema = z.object({
  category_id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().optional(),
  image: z.string().nullish(),
  sort_order: z.number().int().optional(),
});
const brandSchema = z.object({
  subcategory_id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().optional(),
  logo: z.string().nullish(),
  description: z.string().nullish(),
});

const router = Router();

// Public catalog endpoints (for storefront)
router.get('/', listCategories);
router.get('/sub/list', listSubcategories);
router.get('/brand/list', listBrands);

// Admin-only endpoints require authentication
router.use(requireAuth);

// Catalog-wide structure KPIs + health insights.
router.get('/stats', requirePermission('categories.view'), catalogStats);

// Categories mutations
router.post('/', requirePermission('categories.manage'), validate(categorySchema), categories.create);
router.patch('/:id', requirePermission('categories.manage'), validate(categorySchema.partial()), categories.update);
router.delete('/:id', requirePermission('categories.manage'), removeCategory);

// Subcategories mutations
router.post('/sub', requirePermission('categories.manage'), validate(subcategorySchema), subcategories.create);
router.patch('/sub/:id', requirePermission('categories.manage'), validate(subcategorySchema.partial()), subcategories.update);
router.delete('/sub/:id', requirePermission('categories.manage'), removeSubcategory);

// Brands mutations
router.post('/brand', requirePermission('categories.manage'), validate(brandSchema), brands.create);
router.patch('/brand/:id', requirePermission('categories.manage'), validate(brandSchema.partial()), brands.update);
router.delete('/brand/:id', requirePermission('categories.manage'), removeBrand);

export default router;
