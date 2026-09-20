import mongoose from 'mongoose';
import slugify from 'slugify';
import { Product, ProductVariant, Category, Brand } from '../../models/Catalog.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { parseListParams, searchFilter, equalityFilters } from '../../utils/query.js';
import { logActivity } from '../../services/activity.service.js';

const slug = (name) => slugify(name, { lower: true, strict: true });
export const LOW_STOCK_THRESHOLD = 10;

// Collection names (resilient to Mongoose pluralization changes).
const VARIANTS = ProductVariant.collection.name;
const CATEGORIES = Category.collection.name;
const BRANDS = Brand.collection.name;

// Product fields the table is allowed to sort by, plus variant-derived fields
// the aggregation computes (total_stock / min_price / variant_count).
const SORTABLE = new Set(['name', 'created_at', 'is_available', 'total_stock', 'min_price', 'variant_count']);

/**
 * List products with their variant rollups (count, total stock, price range)
 * and joined category/brand names — all computed in a single aggregation so the
 * table can sort/filter on stock and price without N+1 queries.
 */
export const listProducts = asyncHandler(async (req, res) => {
  const { page, pageSize, search, sortBy, sortDir, skip } = parseListParams(req.query);
  const match = {
    ...searchFilter(search, ['name', 'slug']),
    ...equalityFilters(req.query, ['category_id', 'subcategory_id', 'brand_id', 'is_available']),
  };
  // category_id / brand_id arrive as strings; cast for the aggregation match.
  for (const key of ['category_id', 'subcategory_id', 'brand_id']) {
    if (match[key] && mongoose.isValidObjectId(match[key])) {
      match[key] = new mongoose.Types.ObjectId(match[key]);
    }
  }

  // Stock-status filter operates on the computed total_stock.
  const stock = req.query.stock;
  const stockMatch =
    stock === 'out'
      ? { total_stock: { $lte: 0 } }
      : stock === 'low'
      ? { total_stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } }
      : stock === 'in'
      ? { total_stock: { $gt: LOW_STOCK_THRESHOLD } }
      : null;

  const sortField = SORTABLE.has(sortBy) ? sortBy : 'created_at';

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: VARIANTS,
        localField: '_id',
        foreignField: 'product_id',
        as: 'variants',
      },
    },
    {
      $addFields: {
        id: { $toString: '$_id' },
        variant_count: { $size: '$variants' },
        total_stock: { $sum: '$variants.stock' },
        min_price: { $min: '$variants.price' },
        max_price: { $max: '$variants.price' },
      },
    },
    ...(stockMatch ? [{ $match: stockMatch }] : []),
    {
      $lookup: { from: CATEGORIES, localField: 'category_id', foreignField: '_id', as: 'category' },
    },
    { $lookup: { from: BRANDS, localField: 'brand_id', foreignField: '_id', as: 'brand' } },
    {
      $addFields: {
        category: {
          $let: {
            vars: { c: { $arrayElemAt: ['$category', 0] } },
            in: { $cond: ['$$c', { id: { $toString: '$$c._id' }, name: '$$c.name' }, null] },
          },
        },
        brand: {
          $let: {
            vars: { b: { $arrayElemAt: ['$brand', 0] } },
            in: { $cond: ['$$b', { id: { $toString: '$$b._id' }, name: '$$b.name' }, null] },
          },
        },
        variants: {
          $map: {
            input: '$variants',
            as: 'v',
            in: {
              id: { $toString: '$$v._id' },
              quantity: '$$v.quantity',
              price: '$$v.price',
              original_price: '$$v.original_price',
              discount: '$$v.discount',
              stock: '$$v.stock',
              is_available: '$$v.is_available',
            },
          },
        },
      },
    },
    {
      $facet: {
        rows: [
          { $sort: { [sortField]: sortDir, _id: 1 } },
          { $skip: skip },
          { $limit: pageSize },
          { $project: { __v: 0 } },
        ],
        meta: [{ $count: 'total' }],
      },
    },
  ];

  const [result] = await Product.aggregate(pipeline);
  const rows = result?.rows ?? [];
  const total = result?.meta?.[0]?.total ?? 0;
  return paginated(res, rows, total, page, pageSize);
});

/** Catalog-wide KPIs for the products dashboard cards. */
export const productStats = asyncHandler(async (_req, res) => {
  const since = new Date(Date.now() - 7 * 86400000);
  const [productAgg, variantAgg, categoriesCount, brandsCount, recentlyAdded, byCategory] =
    await Promise.all([
      Product.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$is_available', 1, 0] } },
          },
        },
      ]),
      ProductVariant.aggregate([
        {
          $group: {
            _id: null,
            totalVariants: { $sum: 1 },
            totalUnits: { $sum: '$stock' },
            inventoryValue: { $sum: { $multiply: ['$price', '$stock'] } },
            retailValue: { $sum: { $multiply: ['$original_price', '$stock'] } },
            lowStock: {
              $sum: {
                $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', LOW_STOCK_THRESHOLD] }] }, 1, 0],
              },
            },
            outOfStock: { $sum: { $cond: [{ $lte: ['$stock', 0] }, 1, 0] } },
          },
        },
      ]),
      Category.countDocuments({}),
      Brand.countDocuments({}),
      Product.countDocuments({ created_at: { $gte: since } }),
      Product.aggregate([
        { $group: { _id: '$category_id', products: { $sum: 1 } } },
        { $sort: { products: -1 } },
        { $limit: 6 },
        { $lookup: { from: CATEGORIES, localField: '_id', foreignField: '_id', as: 'cat' } },
        {
          $project: {
            _id: 0,
            name: { $ifNull: [{ $arrayElemAt: ['$cat.name', 0] }, 'Uncategorized'] },
            products: 1,
          },
        },
      ]),
    ]);

  const p = productAgg[0] ?? { total: 0, active: 0 };
  const v = variantAgg[0] ?? {
    totalVariants: 0, totalUnits: 0, inventoryValue: 0, retailValue: 0, lowStock: 0, outOfStock: 0,
  };

  return ok(res, {
    totalProducts: p.total,
    activeProducts: p.active,
    hiddenProducts: p.total - p.active,
    totalVariants: v.totalVariants,
    totalUnits: v.totalUnits,
    inventoryValue: v.inventoryValue,
    retailValue: v.retailValue,
    potentialMargin: v.retailValue - v.inventoryValue,
    lowStockVariants: v.lowStock,
    outOfStockVariants: v.outOfStock,
    categoriesCount,
    brandsCount,
    recentlyAdded,
    byCategory,
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  const isObjectId = mongoose.isValidObjectId(req.params.id);
  let query = isObjectId ? { _id: req.params.id } : { slug: req.params.id };

  const legacyMap = {
    'prod-v9': 'bottle-gourd-lauki-ghiya',
    'prod-49': 'fresh-tomatoes',
    'prod-50': 'fresh-potatoes',
    'prod-51': 'fresh-onions',
    'prod-v1': 'green-capsicum-shimla-mirch',
    'prod-v2': 'fresh-orange-carrots-gajar',
    'prod-v3': 'fresh-green-cucumber-kheera',
    'prod-v4': 'lady-finger-bhindi',
    'prod-v5': 'spicy-green-chillies-hari-mirch',
    'prod-v6': 'fresh-ginger-adrak',
    'prod-v7': 'garlic-bulbs-desi-lehsun',
    'prod-v8': 'juicy-yellow-lemon-nimbu',
    'prod-v10': 'fresh-green-peas-hari-matar',
  };

  if (legacyMap[req.params.id]) {
    query = { slug: legacyMap[req.params.id] };
  }

  let doc = await Product.findOne(query)
    .populate([
      { path: 'variants' },
      { path: 'brand', select: 'id name slug logo' },
      { path: 'category', select: 'id name slug' },
      { path: 'subcategory', select: 'id name slug' },
    ])
    .lean({ virtuals: true });

  // If not found by slug directly, try regex search on slug or name
  if (!doc && !isObjectId) {
    doc = await Product.findOne({
      $or: [
        { slug: new RegExp(req.params.id.replace(/-/g, '.*'), 'i') },
        { name: new RegExp(req.params.id.replace(/-/g, '.*'), 'i') },
      ],
    })
      .populate([
        { path: 'variants' },
        { path: 'brand', select: 'id name slug logo' },
        { path: 'category', select: 'id name slug' },
        { path: 'subcategory', select: 'id name slug' },
      ])
      .lean({ virtuals: true });
  }

  if (!doc) throw ApiError.notFound('product not found');
  return ok(res, { ...doc, id: String(doc._id) });
});

function buildProductDoc(input) {
  return {
    name: input.name,
    slug: input.slug || slug(input.name),
    description: input.description ?? null,
    image: input.image ?? null,
    category_id: input.category_id,
    subcategory_id: input.subcategory_id,
    brand_id: input.brand_id,
    is_available: input.is_available ?? true,
    tags: input.tags ?? [],
  };
}

// Upsert provided variants for a product, deleting any removed ones.
async function syncVariants(productId, variants = []) {
  const existing = await ProductVariant.find({ product_id: productId }).select('_id');
  const existingIds = new Set(existing.map((v) => String(v._id)));
  const keptIds = new Set();

  for (const v of variants) {
    const payload = {
      product_id: productId,
      quantity: v.quantity ?? '',
      price: Number(v.price ?? 0),
      original_price: Number(v.original_price ?? v.price ?? 0),
      discount: Number(v.discount ?? 0),
      stock: Number(v.stock ?? 0),
      is_available: v.is_available ?? true,
    };
    if (v.id && existingIds.has(v.id)) {
      keptIds.add(v.id);
      await ProductVariant.findByIdAndUpdate(v.id, payload, { runValidators: true });
    } else {
      await ProductVariant.create(payload);
    }
  }
  const toDelete = [...existingIds].filter((id) => !keptIds.has(id));
  if (toDelete.length) await ProductVariant.deleteMany({ _id: { $in: toDelete } });
}

export const createProduct = asyncHandler(async (req, res) => {
  const { variants = [], ...input } = req.body;
  const product = await Product.create(buildProductDoc(input));
  await syncVariants(product.id, variants);
  await logActivity(req, 'create', 'product', product.id, { name: input.name });
  return created(res, { id: product.id });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { variants, ...input } = req.body;
  const product = await Product.findByIdAndUpdate(req.params.id, buildProductDoc(input), {
    new: true,
    runValidators: true,
  });
  if (!product) throw ApiError.notFound('product not found');
  if (variants) await syncVariants(product.id, variants);
  await logActivity(req, 'update', 'product', product.id, { name: input.name });
  return ok(res, { id: product.id });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw ApiError.notFound('product not found');
  await ProductVariant.deleteMany({ product_id: req.params.id });
  await logActivity(req, 'delete', 'product', req.params.id);
  return ok(res, { success: true });
});

export const bulkAvailability = asyncHandler(async (req, res) => {
  const { ids, is_available } = req.body;
  await Product.updateMany({ _id: { $in: ids } }, { is_available });
  await logActivity(req, 'bulk_update', 'product', null, { ids, is_available });
  return ok(res, { success: true });
});

export const bulkDelete = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  await Product.deleteMany({ _id: { $in: ids } });
  await ProductVariant.deleteMany({ product_id: { $in: ids } });
  await logActivity(req, 'bulk_delete', 'product', null, { ids });
  return ok(res, { success: true });
});
