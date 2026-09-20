import { HomeSection } from '../../models/Marketing.js';
import { Product, Category } from '../../models/Catalog.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { parseListParams, searchFilter } from '../../utils/query.js';
import { logActivity } from '../../services/activity.service.js';

// Format product doc to include variants for ZeptoShelfRow / ZeptoProductCard
function formatProduct(p) {
  if (!p) return null;
  const doc = p.toObject ? p.toObject() : p;
  return {
    ...doc,
    id: doc._id.toString(),
    variants: (doc.variants || []).map((v) => ({
      ...v,
      id: v._id ? v._id.toString() : v.id,
    })),
  };
}

// 1. PUBLIC: Get active home sections for storefront HomePage
export const getPublicHomeSections = asyncHandler(async (_req, res) => {
  let sections = await HomeSection.find({ is_active: true })
    .sort({ sort_order: 1, created_at: 1 })
    .populate('category_id', 'name slug image')
    .populate({
      path: 'product_ids',
      match: { is_active: true },
      populate: { path: 'category_id', select: 'name slug' },
    })
    .lean();

  // If no custom sections yet, seed initial defaults from existing products/categories
  if (!sections || sections.length === 0) {
    const categories = await Category.find({ is_active: true }).limit(5).lean();
    const products = await Product.find({ is_active: true }).limit(20).lean();

    if (categories.length > 0 && products.length > 0) {
      const defaultData = [
        {
          title: 'Daily Essentials',
          subtitle: 'Everyday household & kitchen staples',
          badge: 'Daily Needs',
          section_type: 'custom_products',
          product_ids: products.slice(0, 6).map((p) => p._id),
          sort_order: 1,
          is_active: true,
        },
        {
          title: 'Trending Deals',
          subtitle: 'Best value & highest discounts',
          badge: 'Hot Deals',
          section_type: 'custom_products',
          product_ids: products.slice(6, 12).map((p) => p._id),
          sort_order: 2,
          is_active: true,
        },
        {
          title: 'Cleaning & Care',
          subtitle: 'Spotless clean home essentials',
          badge: 'Popular',
          section_type: 'custom_products',
          product_ids: products.slice(12, 18).map((p) => p._id),
          sort_order: 3,
          is_active: true,
        },
      ];

      await HomeSection.insertMany(defaultData);
      sections = await HomeSection.find({ is_active: true })
        .sort({ sort_order: 1, created_at: 1 })
        .populate('category_id', 'name slug image')
        .populate('product_ids')
        .lean();
    }
  }

  // Format response for storefront
  const formattedSections = [];
  for (const s of sections) {
    let prods = [];
    if (s.section_type === 'category' && s.category_id) {
      const catProds = await Product.find({ category_id: s.category_id._id, is_active: true })
        .limit(15)
        .lean();
      prods = catProds.map(formatProduct);
    } else {
      prods = (s.product_ids || []).map(formatProduct).filter(Boolean);
    }

    if (prods.length > 0) {
      formattedSections.push({
        id: s._id.toString(),
        title: s.title,
        subtitle: s.subtitle,
        badge: s.badge,
        category: s.category_id,
        products: prods,
        sort_order: s.sort_order,
      });
    }
  }

  return ok(res, formattedSections);
});

// 2. ADMIN: List all home sections
export const listHomeSections = asyncHandler(async (req, res) => {
  const { page, pageSize, search, skip } = parseListParams(req.query);
  const filter = {
    ...searchFilter(search, ['title', 'subtitle', 'badge']),
  };

  const [sections, total] = await Promise.all([
    HomeSection.find(filter)
      .sort({ sort_order: 1, created_at: 1 })
      .skip(skip)
      .limit(pageSize)
      .populate('category_id', 'name slug')
      .populate('product_ids', 'name slug price original_price image')
      .lean(),
    HomeSection.countDocuments(filter),
  ]);

  return paginated(
    res,
    sections.map((s) => ({
      ...s,
      id: s._id.toString(),
    })),
    { page, pageSize, total }
  );
});

// 3. ADMIN: Create home section
export const createHomeSection = asyncHandler(async (req, res) => {
  const { title, subtitle, badge, section_type, category_id, product_ids, sort_order, is_active } = req.body;

  if (!title || !title.trim()) {
    throw new ApiError(400, 'Section title is required');
  }

  const count = await HomeSection.countDocuments();

  const section = await HomeSection.create({
    title: title.trim(),
    subtitle: subtitle ? subtitle.trim() : null,
    badge: badge ? badge.trim() : null,
    section_type: section_type || 'custom_products',
    category_id: category_id || null,
    product_ids: Array.isArray(product_ids) ? product_ids : [],
    sort_order: sort_order !== undefined ? Number(sort_order) : count + 1,
    is_active: is_active ?? true,
  });

  await logActivity(req, 'create', 'home_sections', section._id, { title: section.title });
  return created(res, { ...section.toObject(), id: section._id.toString() }, 'Home section created');
});

// 4. ADMIN: Update home section
export const updateHomeSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const section = await HomeSection.findById(id);
  if (!section) throw new ApiError(404, 'Home section not found');

  const { title, subtitle, badge, section_type, category_id, product_ids, sort_order, is_active } = req.body;

  if (title !== undefined) section.title = title.trim();
  if (subtitle !== undefined) section.subtitle = subtitle ? subtitle.trim() : null;
  if (badge !== undefined) section.badge = badge ? badge.trim() : null;
  if (section_type !== undefined) section.section_type = section_type;
  if (category_id !== undefined) section.category_id = category_id || null;
  if (product_ids !== undefined) section.product_ids = Array.isArray(product_ids) ? product_ids : [];
  if (sort_order !== undefined) section.sort_order = Number(sort_order);
  if (is_active !== undefined) section.is_active = Boolean(is_active);

  await section.save();
  await logActivity(req, 'update', 'home_sections', section._id, { title: section.title });

  return ok(res, { ...section.toObject(), id: section._id.toString() }, 'Home section updated');
});

// 5. ADMIN: Delete home section
export const deleteHomeSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const section = await HomeSection.findByIdAndDelete(id);
  if (!section) throw new ApiError(404, 'Home section not found');

  await logActivity(req, 'delete', 'home_sections', id, { title: section.title });
  return ok(res, null, 'Home section deleted');
});

// 6. ADMIN: Reorder home sections
export const reorderHomeSections = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) throw new ApiError(400, 'ids array is required');

  const ops = ids.map((id, index) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { sort_order: index + 1 } },
    },
  }));

  if (ops.length > 0) {
    await HomeSection.bulkWrite(ops);
  }

  return ok(res, null, 'Home sections reordered');
});
