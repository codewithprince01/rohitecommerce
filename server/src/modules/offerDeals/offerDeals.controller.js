import { OfferDeal } from '../../models/Marketing.js';
import { Product } from '../../models/Catalog.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { parseListParams, searchFilter } from '../../utils/query.js';
import { logActivity } from '../../services/activity.service.js';

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

// 1. PUBLIC: Get active offer deals for storefront OffersPage
export const getPublicOfferDeals = asyncHandler(async (_req, res) => {
  let deals = await OfferDeal.find({ is_active: true })
    .sort({ sort_order: 1, created_at: -1 })
    .populate({
      path: 'product_ids',
      match: { is_available: true },
      populate: [
        { path: 'category_id', select: 'name slug' },
        { path: 'variants' },
      ],
    })
    .lean();

  // If no deals exist, seed a sample deal so storefront is lively
  if (!deals || deals.length === 0) {
    const products = await Product.find({ is_available: true })
      .limit(10)
      .populate([{ path: 'category_id', select: 'name slug' }, { path: 'variants' }])
      .lean();
    if (products.length > 0) {
      const sample = await OfferDeal.create({
        title: 'Mega Deals & Offers Corner',
        subtitle: 'Save big on daily essentials with handpicked flash deals & discounts',
        badge: 'Active Deal',
        discount_label: 'Up to 50% Off',
        bg_gradient: 'from-[#0F766E] via-[#059669] to-[#047857]',
        product_ids: products.map((p) => p._id),
        sort_order: 1,
        is_active: true,
      });
      deals = [sample.toObject()];
      deals[0].product_ids = products;
    }
  }

  const formatted = deals.map((d) => ({
    id: d._id.toString(),
    title: d.title,
    subtitle: d.subtitle,
    badge: d.badge,
    discount_label: d.discount_label,
    bg_gradient: d.bg_gradient,
    products: (d.product_ids || []).map(formatProduct).filter(Boolean),
  }));

  return ok(res, formatted);
});

// 2. ADMIN: List all offer deals
export const listOfferDeals = asyncHandler(async (req, res) => {
  const { page, pageSize, search, skip } = parseListParams(req.query);
  const filter = {
    ...searchFilter(search, ['title', 'subtitle', 'badge']),
  };

  const [deals, total] = await Promise.all([
    OfferDeal.find(filter)
      .sort({ sort_order: 1, created_at: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('product_ids', 'name slug image')
      .lean(),
    OfferDeal.countDocuments(filter),
  ]);

  return paginated(
    res,
    deals.map((d) => ({
      ...d,
      id: d._id.toString(),
    })),
    total,
    page,
    pageSize
  );
});

// 3. ADMIN: Create offer deal
export const createOfferDeal = asyncHandler(async (req, res) => {
  const { title, subtitle, badge, discount_label, bg_gradient, product_ids, sort_order, is_active } = req.body;

  if (!title || !title.trim()) {
    throw new ApiError(400, 'Deal title is required');
  }

  const count = await OfferDeal.countDocuments();

  const deal = await OfferDeal.create({
    title: title.trim(),
    subtitle: subtitle ? subtitle.trim() : null,
    badge: badge ? badge.trim() : 'Flash Deal',
    discount_label: discount_label ? discount_label.trim() : null,
    bg_gradient: bg_gradient || 'from-emerald-700 via-emerald-800 to-green-950',
    product_ids: Array.isArray(product_ids) ? product_ids : [],
    sort_order: sort_order !== undefined ? Number(sort_order) : count + 1,
    is_active: is_active ?? true,
  });

  await logActivity(req, 'create', 'offer_deals', deal._id, { title: deal.title });
  return created(res, { ...deal.toObject(), id: deal._id.toString() });
});

// 4. ADMIN: Update offer deal
export const updateOfferDeal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deal = await OfferDeal.findById(id);
  if (!deal) throw new ApiError(404, 'Offer deal not found');

  const { title, subtitle, badge, discount_label, bg_gradient, product_ids, sort_order, is_active } = req.body;

  if (title !== undefined) deal.title = title.trim();
  if (subtitle !== undefined) deal.subtitle = subtitle ? subtitle.trim() : null;
  if (badge !== undefined) deal.badge = badge ? badge.trim() : 'Flash Deal';
  if (discount_label !== undefined) deal.discount_label = discount_label ? discount_label.trim() : null;
  if (bg_gradient !== undefined) deal.bg_gradient = bg_gradient;
  if (product_ids !== undefined) deal.product_ids = Array.isArray(product_ids) ? product_ids : [];
  if (sort_order !== undefined) deal.sort_order = Number(sort_order);
  if (is_active !== undefined) deal.is_active = Boolean(is_active);

  await deal.save();
  await logActivity(req, 'update', 'offer_deals', deal._id, { title: deal.title });

  return ok(res, { ...deal.toObject(), id: deal._id.toString() });
});

// 5. ADMIN: Delete offer deal
export const deleteOfferDeal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deal = await OfferDeal.findByIdAndDelete(id);
  if (!deal) throw new ApiError(404, 'Offer deal not found');

  await logActivity(req, 'delete', 'offer_deals', id, { title: deal.title });
  return ok(res, { success: true });
});
