import { HomeSection } from '../../models/Marketing.js';
import { Product, Category, Subcategory, Brand } from '../../models/Catalog.js';
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

/**
 * A catalog-driven section stores its node in one field, named by its type.
 * Products carry the whole chain, so one shelf definition works at any depth.
 */
const SOURCE = {
  category: { field: 'category_id', label: 'Category' },
  subcategory: { field: 'subcategory_id', label: 'Subcategory' },
  brand: { field: 'brand_id', label: 'Sub-sub category' },
};

/**
 * Slugs the storefront needs to open the right listing when "See all" is
 * tapped. A subcategory shelf has to name its category too, because the
 * customer-facing route spells the whole path out.
 */
async function buildSectionLink(section) {
  if (section.section_type === 'category' && section.category_id) {
    return { type: 'category', category_slug: section.category_id.slug ?? null };
  }

  if (section.section_type === 'subcategory' && section.subcategory_id) {
    const sub = section.subcategory_id;
    const cat = sub.category_id ? await Category.findById(sub.category_id).select('slug').lean() : null;
    return {
      type: 'subcategory',
      category_slug: cat?.slug ?? null,
      subcategory_slug: sub.slug ?? null,
    };
  }

  if (section.section_type === 'brand' && section.brand_id) {
    const brand = section.brand_id;
    const sub = brand.subcategory_id
      ? await Subcategory.findById(brand.subcategory_id).select('slug category_id').lean()
      : null;
    const cat = sub?.category_id ? await Category.findById(sub.category_id).select('slug').lean() : null;
    return {
      type: 'brand',
      category_slug: cat?.slug ?? null,
      subcategory_slug: sub?.slug ?? null,
      brand_slug: brand.slug ?? null,
    };
  }

  return null;
}

// 1. PUBLIC: Get active home sections for storefront HomePage
export const getPublicHomeSections = asyncHandler(async (_req, res) => {
  let sections = await HomeSection.find({ is_active: true })
    .sort({ sort_order: 1, created_at: 1 })
    .populate('category_id', 'name slug image')
    .populate('subcategory_id', 'name slug image category_id')
    .populate('brand_id', 'name slug logo subcategory_id')
    .populate({
      path: 'product_ids',
      match: { is_available: true },
      populate: [
        { path: 'category_id', select: 'name slug' },
        { path: 'variants' },
      ],
    })
    .lean();

  // If no custom sections yet, seed initial defaults from existing products/categories
  if (!sections || sections.length === 0) {
    const categories = await Category.find({}).limit(5).lean();
    const products = await Product.find({ is_available: true }).limit(20).lean();

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
        .populate('subcategory_id', 'name slug image category_id')
        .populate('brand_id', 'name slug logo subcategory_id')
        .populate({ path: 'product_ids', populate: [{ path: 'category_id', select: 'name slug' }, { path: 'variants' }] })
        .lean();
    }
  }

  // Format response for storefront
  const formattedSections = [];
  for (const s of sections) {
    const source = SOURCE[s.section_type];
    let prods = [];

    if (source && s[source.field]) {
      // One query shape for all three depths: a product stores its category,
      // subcategory and brand, so the filter is just the matching field.
      const catalogProds = await Product.find({
        [source.field]: s[source.field]._id,
        is_available: true,
      })
        .limit(15)
        .populate([{ path: 'category_id', select: 'name slug' }, { path: 'variants' }])
        .lean();
      prods = catalogProds.map(formatProduct);
    } else {
      prods = (s.product_ids || []).map(formatProduct).filter(Boolean);
    }

    if (prods.length > 0) {
      formattedSections.push({
        id: s._id.toString(),
        title: s.title,
        subtitle: s.subtitle,
        badge: s.badge,
        section_type: s.section_type,
        // Kept for older clients that only ever read `category`.
        category: s.category_id,
        subcategory: s.subcategory_id ?? null,
        brand: s.brand_id ?? null,
        link: await buildSectionLink(s),
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
      // The parent chain comes along so the edit form can pre-select the
      // cascading Category → Subcategory → Sub-sub category pickers.
      .populate('subcategory_id', 'name slug category_id')
      .populate({
        path: 'brand_id',
        select: 'name slug subcategory_id',
        populate: { path: 'subcategory_id', select: 'name slug category_id' },
      })
      .populate('product_ids', 'name slug image')
      .lean(),
    HomeSection.countDocuments(filter),
  ]);

  return paginated(
    res,
    sections.map((s) => ({
      ...s,
      id: s._id.toString(),
    })),
    total,
    page,
    pageSize
  );
});

// 3. ADMIN: Create home section
/**
 * Keep the catalog reference that matches the chosen type and clear the other
 * two, so switching a shelf from "Category" to "Sub-sub category" can never
 * leave a stale id behind that silently wins at read time.
 */
async function resolveSource(sectionType, { category_id, subcategory_id, brand_id }) {
  const source = SOURCE[sectionType];
  const ids = { category_id: null, subcategory_id: null, brand_id: null };
  if (!source) return ids;

  const given = { category_id, subcategory_id, brand_id }[source.field];
  if (!given) throw new ApiError(400, `${source.label} is required for this section`);

  const Model = { category_id: Category, subcategory_id: Subcategory, brand_id: Brand }[source.field];
  const exists = await Model.exists({ _id: given });
  if (!exists) throw new ApiError(400, `That ${source.label.toLowerCase()} no longer exists`);

  ids[source.field] = given;
  return ids;
}

export const createHomeSection = asyncHandler(async (req, res) => {
  const { title, subtitle, badge, section_type, category_id, subcategory_id, brand_id, product_ids, sort_order, is_active } = req.body;

  if (!title || !title.trim()) {
    throw new ApiError(400, 'Section title is required');
  }

  const type = section_type || 'custom_products';
  const sourceIds = await resolveSource(type, { category_id, subcategory_id, brand_id });
  const count = await HomeSection.countDocuments();

  const section = await HomeSection.create({
    title: title.trim(),
    subtitle: subtitle ? subtitle.trim() : null,
    badge: badge ? badge.trim() : null,
    section_type: type,
    ...sourceIds,
    product_ids: type === 'custom_products' && Array.isArray(product_ids) ? product_ids : [],
    sort_order: sort_order !== undefined ? Number(sort_order) : count + 1,
    is_active: is_active ?? true,
  });

  await logActivity(req, 'create', 'home_sections', section._id, { title: section.title });
  return created(res, { ...section.toObject(), id: section._id.toString() });
});

// 4. ADMIN: Update home section
export const updateHomeSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const section = await HomeSection.findById(id);
  if (!section) throw new ApiError(404, 'Home section not found');

  const { title, subtitle, badge, section_type, category_id, subcategory_id, brand_id, product_ids, sort_order, is_active } = req.body;

  if (title !== undefined) section.title = title.trim();
  if (subtitle !== undefined) section.subtitle = subtitle ? subtitle.trim() : null;
  if (badge !== undefined) section.badge = badge ? badge.trim() : null;

  // The type and its catalog reference are resolved together — a partial
  // update that touches either one has to leave a consistent pair behind.
  const touchesSource =
    section_type !== undefined ||
    category_id !== undefined ||
    subcategory_id !== undefined ||
    brand_id !== undefined;

  if (touchesSource) {
    const type = section_type ?? section.section_type;
    const sourceIds = await resolveSource(type, {
      category_id: category_id !== undefined ? category_id : section.category_id,
      subcategory_id: subcategory_id !== undefined ? subcategory_id : section.subcategory_id,
      brand_id: brand_id !== undefined ? brand_id : section.brand_id,
    });
    section.section_type = type;
    section.category_id = sourceIds.category_id;
    section.subcategory_id = sourceIds.subcategory_id;
    section.brand_id = sourceIds.brand_id;
  }

  if (product_ids !== undefined) {
    section.product_ids =
      section.section_type === 'custom_products' && Array.isArray(product_ids) ? product_ids : [];
  }
  if (sort_order !== undefined) section.sort_order = Number(sort_order);
  if (is_active !== undefined) section.is_active = Boolean(is_active);

  await section.save();
  await logActivity(req, 'update', 'home_sections', section._id, { title: section.title });

  return ok(res, { ...section.toObject(), id: section._id.toString() });
});

// 5. ADMIN: Delete home section
export const deleteHomeSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const section = await HomeSection.findByIdAndDelete(id);
  if (!section) throw new ApiError(404, 'Home section not found');

  await logActivity(req, 'delete', 'home_sections', id, { title: section.title });
  return ok(res, { success: true });
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

  return ok(res, { success: true });
});
