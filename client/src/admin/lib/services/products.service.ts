import { api, apiList } from '../api';
import type { ListParams, Paginated } from '../types';

/* ------------------------------- Types -------------------------------- */

export interface ProductVariant {
  id: string;
  product_id?: string;
  quantity: string;
  price: number;
  original_price: number;
  discount: number;
  stock: number;
  is_available: boolean;
}

export interface ProductListRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  is_available: boolean;
  tags: string[];
  category_id: string;
  subcategory_id: string;
  brand_id: string;
  created_at: string;
  variants: ProductVariant[];
  category?: { id: string; name: string } | null;
  brand?: { id: string; name: string } | null;
  // Variant rollups computed server-side.
  variant_count: number;
  total_stock: number;
  min_price: number | null;
  max_price: number | null;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  hiddenProducts: number;
  totalVariants: number;
  totalUnits: number;
  inventoryValue: number;
  retailValue: number;
  potentialMargin: number;
  lowStockVariants: number;
  outOfStockVariants: number;
  categoriesCount: number;
  brandsCount: number;
  recentlyAdded: number;
  byCategory: { name: string; products: number }[];
}

export interface ProductInput {
  name: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  category_id: string;
  subcategory_id: string;
  brand_id: string;
  is_available?: boolean;
  tags?: string[];
}

/* ------------------------------ Queries ------------------------------- */

export function listProducts(params: ListParams): Promise<Paginated<ProductListRow>> {
  return apiList<ProductListRow>('/products', params);
}

export function getProductStats(): Promise<ProductStats> {
  return api.get<ProductStats>('/products/stats');
}

export function getProduct(id: string): Promise<ProductListRow> {
  return api.get<ProductListRow>(`/products/${id}`);
}

/* ----------------------------- Mutations ------------------------------ */

export async function createProduct(
  input: ProductInput,
  variants: Partial<ProductVariant>[]
): Promise<string> {
  const { id } = await api.post<{ id: string }>('/products', { ...input, variants });
  return id;
}

export async function updateProduct(
  id: string,
  input: ProductInput,
  variants: Partial<ProductVariant>[]
): Promise<void> {
  await api.patch(`/products/${id}`, { ...input, variants });
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function bulkSetAvailability(ids: string[], isAvailable: boolean): Promise<void> {
  await api.post('/products/bulk/availability', { ids, is_available: isAvailable });
}

export async function bulkDeleteProducts(ids: string[]): Promise<void> {
  await api.post('/products/bulk/delete', { ids });
}

/* ------------------------------- Export ------------------------------- */

/**
 * Fetches every product matching the current filters (paging through the API)
 * and returns a CSV string — real data only, no client-side fabrication.
 */
export async function exportProductsCsv(params: ListParams): Promise<string> {
  const pageSize = 100;
  let page = 1;
  const all: ProductListRow[] = [];
  // Page through results until we've collected everything that matches.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { rows, total } = await apiList<ProductListRow>('/products', { ...params, page, pageSize });
    all.push(...rows);
    if (all.length >= total || rows.length === 0) break;
    page += 1;
  }

  const header = ['Name', 'Category', 'Brand', 'Variants', 'Total Stock', 'Min Price', 'Max Price', 'Status', 'Created'];
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = all.map((p) =>
    [
      p.name,
      p.category?.name ?? '',
      p.brand?.name ?? '',
      p.variant_count,
      p.total_stock,
      p.min_price ?? '',
      p.max_price ?? '',
      p.is_available ? 'Active' : 'Hidden',
      new Date(p.created_at).toISOString().slice(0, 10),
    ]
      .map(escape)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
}
