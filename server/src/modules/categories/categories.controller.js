import mongoose from 'mongoose';
import { Category, Subcategory, Brand, Product, ProductVariant } from '../../models/Catalog.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, paginated } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { parseListParams, searchFilter, equalityFilters } from '../../utils/query.js';
import { logActivity } from '../../services/activity.service.js';

// Collection names (resilient to Mongoose pluralization changes).
const SUBCATEGORIES = Subcategory.collection.name;
const BRANDS = Brand.collection.name;
const PRODUCTS = Product.collection.name;

/** Cast allowed equality filters that hold ObjectId references for $match. */
function castObjectIds(match, keys) {
  for (const key of keys) {
    if (match[key] && mongoose.isValidObjectId(match[key])) {
      match[key] = new mongoose.Types.ObjectId(match[key]);
    }
  }
  return match;
}

/**
 * Run a count-enriched, sortable, paginated aggregation for a catalog level.
 * Shared by categories / subcategories / brands so they all support sorting on
 * computed counts (e.g. product_count) without N+1 queries.
 */
async function runEnrichedList({ Model, req, res, searchFields, filterFields, idFilters, sortable, addStages, projectOut }) {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseListParams(req.query);
  const match = castObjectIds(
    {
      ...searchFilter(search, searchFields),
      ...equalityFilters(req.query, filterFields),
    },
    idFilters
  );

  const sortField = sortable.has(sortBy) ? sortBy : 'sort_order';

  const pipeline = [
    { $match: match },
    ...addStages,
    { $addFields: { id: { $toString: '$_id' } } },
    {
      $facet: {
        rows: [
          { $sort: { [sortField]: sortDir, _id: 1 } },
          { $skip: skip },
          { $limit: pageSize },
          { $project: { __v: 0, ...projectOut } },
        ],
        meta: [{ $count: 'total' }],
      },
    },
  ];

  const [result] = await Model.aggregate(pipeline);
  const rows = result?.rows ?? [];
  const total = result?.meta?.[0]?.total ?? 0;
  return paginated(res, rows, total, page, pageSize);
}

/* ------------------------------ List handlers ------------------------------ */

// Categories enriched with subcategory / brand / product counts.
export const listCategories = asyncHandler((req, res) =>
  runEnrichedList({
    Model: Category,
    req,
    res,
    searchFields: ['name', 'slug'],
    filterFields: [],
    idFilters: [],
    sortable: new Set(['name', 'sort_order', 'created_at', 'subcategory_count', 'brand_count', 'product_count']),
    addStages: [
      { $lookup: { from: SUBCATEGORIES, localField: '_id', foreignField: 'category_id', as: 'subs' } },
      { $lookup: { from: PRODUCTS, localField: '_id', foreignField: 'category_id', as: 'prods' } },
      {
        $lookup: {
          from: BRANDS,
          let: { subIds: '$subs._id' },
          pipeline: [{ $match: { $expr: { $in: ['$subcategory_id', '$$subIds'] } } }, { $count: 'n' }],
          as: 'brandAgg',
        },
      },
      {
        $addFields: {
          subcategory_count: { $size: '$subs' },
          product_count: { $size: '$prods' },
          brand_count: { $ifNull: [{ $arrayElemAt: ['$brandAgg.n', 0] }, 0] },
        },
      },
    ],
    projectOut: { subs: 0, prods: 0, brandAgg: 0 },
  })
);

// Subcategories enriched with brand / product counts + parent category.
export const listSubcategories = asyncHandler((req, res) =>
  runEnrichedList({
    Model: Subcategory,
    req,
    res,
    searchFields: ['name', 'slug'],
    filterFields: ['category_id'],
    idFilters: ['category_id'],
    sortable: new Set(['name', 'sort_order', 'created_at', 'brand_count', 'product_count']),
    addStages: [
      { $lookup: { from: BRANDS, localField: '_id', foreignField: 'subcategory_id', as: 'brands' } },
      { $lookup: { from: PRODUCTS, localField: '_id', foreignField: 'subcategory_id', as: 'prods' } },
      { $lookup: { from: Category.collection.name, localField: 'category_id', foreignField: '_id', as: 'cat' } },
      {
        $addFields: {
          brand_count: { $size: '$brands' },
          product_count: { $size: '$prods' },
          category: {
            $let: {
              vars: { c: { $arrayElemAt: ['$cat', 0] } },
              // The slug comes along so the storefront can build the full
              // /categories/<cat>/<sub> path from a search result alone.
              in: {
                $cond: ['$$c', { id: { $toString: '$$c._id' }, name: '$$c.name', slug: '$$c.slug' }, null],
              },
            },
          },
        },
      },
    ],
    projectOut: { brands: 0, prods: 0, cat: 0 },
  })
);

// Brands enriched with product count + parent subcategory.
export const listBrands = asyncHandler((req, res) =>
  runEnrichedList({
    Model: Brand,
    req,
    res,
    searchFields: ['name', 'slug'],
    filterFields: ['subcategory_id'],
    idFilters: ['subcategory_id'],
    sortable: new Set(['name', 'created_at', 'product_count']),
    addStages: [
      { $lookup: { from: PRODUCTS, localField: '_id', foreignField: 'brand_id', as: 'prods' } },
      { $lookup: { from: SUBCATEGORIES, localField: 'subcategory_id', foreignField: '_id', as: 'sub' } },
      {
        $addFields: {
          product_count: { $size: '$prods' },
          subcategory: {
            $let: {
              vars: { s: { $arrayElemAt: ['$sub', 0] } },
              // Slug + parent id so a brand found by search knows its whole path.
              in: {
                $cond: [
                  '$$s',
                  {
                    id: { $toString: '$$s._id' },
                    name: '$$s.name',
                    slug: '$$s.slug',
                    category_id: { $toString: '$$s.category_id' },
                  },
                  null,
                ],
              },
            },
          },
        },
      },
    ],
    projectOut: { prods: 0, sub: 0 },
  })
);

/* --------------------------------- Stats ---------------------------------- */

/** Catalog-structure KPIs + health insights for the categories dashboard. */
export const catalogStats = asyncHandler(async (_req, res) => {
  const emptyCount = (Model, foreignField) =>
    Model.aggregate([
      { $lookup: { from: PRODUCTS, localField: '_id', foreignField, as: 'p' } },
      { $match: { 'p.0': { $exists: false } } },
      { $count: 'n' },
    ]).then((r) => r[0]?.n ?? 0);

  const [
    totalCategories,
    totalSubcategories,
    totalBrands,
    totalProducts,
    totalVariants,
    emptyCategories,
    emptySubcategories,
    emptyBrands,
    topCategories,
  ] = await Promise.all([
    Category.countDocuments({}),
    Subcategory.countDocuments({}),
    Brand.countDocuments({}),
    Product.countDocuments({}),
    ProductVariant.countDocuments({}),
    emptyCount(Category, 'category_id'),
    emptyCount(Subcategory, 'subcategory_id'),
    emptyCount(Brand, 'brand_id'),
    Product.aggregate([
      { $group: { _id: '$category_id', products: { $sum: 1 } } },
      { $sort: { products: -1 } },
      { $limit: 8 },
      { $lookup: { from: Category.collection.name, localField: '_id', foreignField: '_id', as: 'cat' } },
      {
        $project: {
          _id: 0,
          id: { $toString: '$_id' },
          name: { $ifNull: [{ $arrayElemAt: ['$cat.name', 0] }, 'Uncategorized'] },
          image: { $arrayElemAt: ['$cat.image', 0] },
          products: 1,
        },
      },
    ]),
  ]);

  return ok(res, {
    totalCategories,
    totalSubcategories,
    totalBrands,
    totalProducts,
    totalVariants,
    emptyCategories,
    emptySubcategories,
    emptyBrands,
    avgProductsPerCategory: totalCategories ? Math.round((totalProducts / totalCategories) * 10) / 10 : 0,
    topCategories,
  });
});

/* ----------------------------- Cascade deletes ----------------------------- */
// The catalog is a strict hierarchy (category → subcategory → brand → product →
// variant). Deleting a node must remove everything beneath it, otherwise the
// storefront is left with orphaned, unreachable records.

async function deleteProductsAndVariants(productFilter) {
  const products = await Product.find(productFilter).select('_id');
  const ids = products.map((p) => p._id);
  if (ids.length) {
    await ProductVariant.deleteMany({ product_id: { $in: ids } });
    await Product.deleteMany({ _id: { $in: ids } });
  }
  return ids.length;
}

export const removeCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findById(id);
  if (!category) throw ApiError.notFound('category not found');

  const subs = await Subcategory.find({ category_id: id }).select('_id');
  const subIds = subs.map((s) => s._id);

  const removedProducts = await deleteProductsAndVariants({ category_id: id });
  if (subIds.length) await Brand.deleteMany({ subcategory_id: { $in: subIds } });
  await Subcategory.deleteMany({ category_id: id });
  await Category.findByIdAndDelete(id);

  await logActivity(req, 'delete', 'category', id, {
    cascade: { subcategories: subIds.length, products: removedProducts },
  });
  return ok(res, { success: true, removed: { subcategories: subIds.length, products: removedProducts } });
});

export const removeSubcategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sub = await Subcategory.findById(id);
  if (!sub) throw ApiError.notFound('subcategory not found');

  const removedProducts = await deleteProductsAndVariants({ subcategory_id: id });
  await Brand.deleteMany({ subcategory_id: id });
  await Subcategory.findByIdAndDelete(id);

  await logActivity(req, 'delete', 'subcategory', id, { cascade: { products: removedProducts } });
  return ok(res, { success: true, removed: { products: removedProducts } });
});

export const removeBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brand = await Brand.findById(id);
  if (!brand) throw ApiError.notFound('brand not found');

  const removedProducts = await deleteProductsAndVariants({ brand_id: id });
  await Brand.findByIdAndDelete(id);

  await logActivity(req, 'delete', 'brand', id, { cascade: { products: removedProducts } });
  return ok(res, { success: true, removed: { products: removedProducts } });
});
