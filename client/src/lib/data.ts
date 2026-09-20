/**
 * Storefront data layer.
 *
 * Every function here reads live data from the Express/MongoDB API and nothing
 * else — there is no mock catalog, no hardcoded placeholder image and no local
 * fallback. If the store has no categories or products yet, these return empty
 * results and the pages render their empty states, so what a shopper sees is
 * always exactly what the admin has published.
 */

import type { Category, Subcategory, Brand, ProductWithVariants } from './supabase';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

/* ------------------------------ Fetch helper ------------------------------ */

/**
 * GET a public endpoint and unwrap the `{ success, data }` envelope.
 * Network/parse failures resolve to `null` so a page can show an empty state
 * instead of crashing; the reason is logged for debugging.
 */
async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) {
      console.warn(`GET ${path} failed with ${res.status}`);
      return null;
    }
    const json = await res.json();
    return (json?.data as T) ?? null;
  } catch (err) {
    console.warn(`GET ${path} could not reach the API`, err);
    return null;
  }
}

/** GET a paginated list endpoint and return just the rows. */
async function getRows<T>(path: string): Promise<T[]> {
  const data = await getJson<{ rows?: T[] }>(path);
  return Array.isArray(data?.rows) ? data.rows : [];
}

const bySortOrder = (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order;

/* --------------------------------- Mappers -------------------------------- */

function mapCategory(r: any): Category {
  return {
    id: r.id || r._id,
    name: r.name,
    slug: r.slug,
    image: r.image ?? null,
    bg_color: r.bg_color || 'bg-neutral-100',
    sort_order: r.sort_order ?? 0,
    subcategory_count: r.subcategory_count,
    product_count: r.product_count,
    brand_count: r.brand_count,
    created_at: r.created_at || '',
  };
}

function mapSubcategory(r: any): Subcategory {
  return {
    id: r.id || r._id,
    category_id: r.category_id || r.category?.id || '',
    name: r.name,
    slug: r.slug,
    image: r.image ?? null,
    sort_order: r.sort_order ?? 0,
    product_count: r.product_count,
    brand_count: r.brand_count,
    category: r.category ? { id: r.category.id, name: r.category.name, slug: r.category.slug } : undefined,
    created_at: r.created_at || '',
  };
}

function mapBrand(r: any): Brand {
  return {
    id: r.id || r._id,
    subcategory_id: r.subcategory_id || r.subcategory?.id || '',
    name: r.name,
    slug: r.slug,
    logo: r.logo ?? null,
    description: r.description ?? null,
    created_at: r.created_at || '',
  };
}

export function mapProduct(p: any): ProductWithVariants {
  const productId = p.id || p._id;
  return {
    id: productId,
    brand_id: p.brand_id,
    category_id: p.category_id,
    subcategory_id: p.subcategory_id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? null,
    // Null when the admin has not set one — cards render their own placeholder.
    image: p.image ?? null,
    is_available: p.is_available ?? true,
    tags: p.tags || [],
    created_at: p.created_at || '',
    variants: (p.variants || []).map((v: any) => ({
      id: v.id || v._id,
      product_id: productId,
      quantity: v.quantity,
      price: v.price,
      original_price: v.original_price ?? v.price,
      discount: v.discount ?? 0,
      stock: v.stock ?? 0,
      is_available: v.is_available ?? true,
      created_at: v.created_at || '',
    })),
    brand: p.brand ? mapBrand(p.brand) : undefined,
    category: p.category ? mapCategory(p.category) : undefined,
    subcategory: p.subcategory ? mapSubcategory(p.subcategory) : undefined,
  };
}

/* ------------------------------- Categories ------------------------------- */

export async function getCategories(): Promise<Category[]> {
  const rows = await getRows<any>('/categories?pageSize=100');
  return rows.map(mapCategory).sort(bySortOrder);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

/* ------------------------------ Subcategories ----------------------------- */

export async function getAllSubcategories(): Promise<Subcategory[]> {
  const rows = await getRows<any>('/categories/sub/list?pageSize=200');
  return rows.map(mapSubcategory).sort(bySortOrder);
}

export async function getSubcategoriesByCategory(categorySlug: string): Promise<Subcategory[]> {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return [];
  const rows = await getRows<any>(`/categories/sub/list?pageSize=100&category_id=${category.id}`);
  return rows.map(mapSubcategory).sort(bySortOrder);
}

export async function getSubcategoryBySlug(slug: string): Promise<Subcategory | null> {
  // The list endpoint searches name and slug, so narrow the match ourselves.
  const rows = await getRows<any>(`/categories/sub/list?pageSize=100&search=${encodeURIComponent(slug)}`);
  const match = rows.find((r) => r.slug === slug) ?? rows[0];
  return match ? mapSubcategory(match) : null;
}

/* ---------------------------------- Brands -------------------------------- */

export async function getBrandsBySubcategory(subcategorySlug: string): Promise<Brand[]> {
  const subcategory = await getSubcategoryBySlug(subcategorySlug);
  if (!subcategory) return [];
  const rows = await getRows<any>(`/categories/brand/list?pageSize=100&subcategory_id=${subcategory.id}`);
  return rows.map(mapBrand);
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const rows = await getRows<any>(`/categories/brand/list?pageSize=100&search=${encodeURIComponent(slug)}`);
  const match = rows.find((r) => r.slug === slug) ?? rows[0];
  return match ? mapBrand(match) : null;
}

/* --------------------------------- Products ------------------------------- */

export async function getAllProducts(): Promise<ProductWithVariants[]> {
  const rows = await getRows<any>('/products?pageSize=200');
  return rows.map(mapProduct);
}

export async function getFeaturedProducts(): Promise<ProductWithVariants[]> {
  const rows = await getRows<any>('/products?pageSize=12');
  return rows.map(mapProduct);
}

export async function getProductsByCategory(categorySlug: string): Promise<ProductWithVariants[]> {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return [];
  const rows = await getRows<any>(`/products?pageSize=100&category_id=${category.id}`);
  return rows.map(mapProduct);
}

export async function getProductsBySubcategory(subcategorySlug: string): Promise<ProductWithVariants[]> {
  const subcategory = await getSubcategoryBySlug(subcategorySlug);
  if (!subcategory) return [];
  const rows = await getRows<any>(`/products?pageSize=100&subcategory_id=${subcategory.id}`);
  return rows.map(mapProduct);
}

export async function getProductsByBrand(brandSlug: string): Promise<ProductWithVariants[]> {
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) return [];
  const rows = await getRows<any>(`/products?pageSize=100&brand_id=${brand.id}`);
  return rows.map(mapProduct);
}

export async function searchProducts(query: string): Promise<ProductWithVariants[]> {
  const term = query.trim();
  if (!term) return [];
  const rows = await getRows<any>(`/products?pageSize=20&search=${encodeURIComponent(term)}`);
  return rows.map(mapProduct);
}

/** Fetch one product. The API resolves both an id and a slug on this route. */
export async function getProductById(id: string): Promise<ProductWithVariants | null> {
  const doc = await getJson<any>(`/products/${encodeURIComponent(id)}`);
  return doc ? mapProduct(doc) : null;
}

export const getProductBySlug = getProductById;

/**
 * Keep only the ids that still resolve to a product.
 *
 * Saved wishlists live in the browser and outlive the catalog, so an item the
 * admin deleted would otherwise be counted forever by a badge that the wishlist
 * page can never fill. Only a definitive 404 drops an id — this **throws** when
 * the API cannot be reached, so callers keep the list rather than clearing it
 * over a dropped connection.
 */
export async function pruneMissingProductIds(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return ids;

  // Reachability probe first; a network failure rejects and nothing is pruned.
  const probe = await fetch(`${API_BASE}/health`);
  if (!probe.ok) throw new Error(`API health check failed (${probe.status})`);

  const checked = await Promise.all(
    ids.map(async (id) => {
      const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`);
      // Anything other than "definitely gone" keeps the entry.
      return res.status === 404 ? null : id;
    })
  );
  return checked.filter((id): id is string => id !== null);
}

/* ----------------------- Admin-configured storefront ---------------------- */

export interface PublicHomeSection {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  category?: { _id: string; name: string; slug: string; image?: string };
  products: ProductWithVariants[];
  sort_order: number;
}

export interface PublicOfferDeal {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  discount_label?: string;
  bg_gradient?: string;
  products: ProductWithVariants[];
  sort_order: number;
}

/** Home page shelves, exactly as configured in Admin → Home Sections. */
export async function getPublicHomeSections(): Promise<PublicHomeSection[]> {
  const rows = await getJson<any[]>('/home-sections/public');
  if (!Array.isArray(rows)) return [];
  return rows.map((s) => ({ ...s, products: (s.products || []).map(mapProduct) }));
}

/** Offer campaigns, exactly as configured in Admin → Offers & Deals. */
export async function getPublicOfferDeals(): Promise<PublicOfferDeal[]> {
  const rows = await getJson<any[]>('/offer-deals/public');
  if (!Array.isArray(rows)) return [];
  return rows.map((d) => ({ ...d, products: (d.products || []).map(mapProduct) }));
}
