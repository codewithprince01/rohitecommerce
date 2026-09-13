import { api, apiList } from '../api';
import type { ListParams, Paginated } from '../types';

/* ------------------------------- Types -------------------------------- */

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  bg_color: string;
  sort_order: number;
  created_at: string;
  /** Rollups computed by the enriched list aggregation. */
  subcategory_count?: number;
  brand_count?: number;
  product_count?: number;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  image: string | null;
  sort_order: number;
  created_at: string;
  category?: { id: string; name: string } | null;
  brand_count?: number;
  product_count?: number;
}

export interface Brand {
  id: string;
  subcategory_id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  created_at: string;
  subcategory?: { id: string; name: string } | null;
  product_count?: number;
}

export interface CatalogStats {
  totalCategories: number;
  totalSubcategories: number;
  totalBrands: number;
  totalProducts: number;
  totalVariants: number;
  emptyCategories: number;
  emptySubcategories: number;
  emptyBrands: number;
  avgProductsPerCategory: number;
  topCategories: { id: string; name: string; image: string | null; products: number }[];
}

export function getCatalogStats(): Promise<CatalogStats> {
  return api.get<CatalogStats>('/categories/stats');
}

const ALL = { pageSize: 100, sortBy: 'sort_order', sortDir: 'asc' as const };

/* ----------------------------- Categories ----------------------------- */

export function listCategories(params: ListParams): Promise<Paginated<Category>> {
  return apiList<Category>('/categories', params);
}

export async function allCategories(): Promise<Category[]> {
  const { rows } = await apiList<Category>('/categories', ALL);
  return rows;
}

export function createCategory(values: Partial<Category>): Promise<Category> {
  return api.post<Category>('/categories', values);
}

export function updateCategory(id: string, values: Partial<Category>): Promise<Category> {
  return api.patch<Category>(`/categories/${id}`, values);
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}

/* ---------------------------- Subcategories ---------------------------- */

export function listSubcategories(params: ListParams): Promise<Paginated<Subcategory>> {
  return apiList<Subcategory>('/categories/sub/list', params);
}

export async function allSubcategories(categoryId?: string): Promise<Subcategory[]> {
  const { rows } = await apiList<Subcategory>('/categories/sub/list', {
    ...ALL,
    filters: categoryId ? { category_id: categoryId } : {},
  });
  return rows;
}

export function createSubcategory(values: Partial<Subcategory>): Promise<Subcategory> {
  return api.post<Subcategory>('/categories/sub', values);
}

export function updateSubcategory(id: string, values: Partial<Subcategory>): Promise<Subcategory> {
  return api.patch<Subcategory>(`/categories/sub/${id}`, values);
}

export async function deleteSubcategory(id: string): Promise<void> {
  await api.delete(`/categories/sub/${id}`);
}

/* -------------------------------- Brands ------------------------------- */

export function listBrands(params: ListParams): Promise<Paginated<Brand>> {
  return apiList<Brand>('/categories/brand/list', params);
}

export async function allBrands(subcategoryId?: string): Promise<Brand[]> {
  const { rows } = await apiList<Brand>('/categories/brand/list', {
    pageSize: 100,
    sortBy: 'name',
    sortDir: 'asc',
    filters: subcategoryId ? { subcategory_id: subcategoryId } : {},
  });
  return rows;
}

export function createBrand(values: Partial<Brand>): Promise<Brand> {
  return api.post<Brand>('/categories/brand', values);
}

export function updateBrand(id: string, values: Partial<Brand>): Promise<Brand> {
  return api.patch<Brand>(`/categories/brand/${id}`, values);
}

export async function deleteBrand(id: string): Promise<void> {
  await api.delete(`/categories/brand/${id}`);
}
