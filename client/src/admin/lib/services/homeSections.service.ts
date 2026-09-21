import { api, apiList } from '../api';
import type { ListParams, Paginated } from '../types';

/** A product as the section list endpoint returns it (trimmed projection). */
export interface SectionProductRef {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  image?: string | null;
}

/** Where a shelf gets its products from. */
export type HomeSectionType = 'custom_products' | 'category' | 'subcategory' | 'brand';

/** A populated catalog reference as the list endpoint returns it. */
export interface CatalogRef {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  /** Parent of a subcategory ref — an id, since nothing above it is populated. */
  category_id?: string | null;
  /** Parent of a sub-sub category ref, populated one level so the chain is whole. */
  subcategory_id?: CatalogRef | string | null;
}

/** Read an id off a field that may be a bare id or a populated document. */
export function refId(value: CatalogRef | string | null | undefined): string {
  if (!value) return '';
  return typeof value === 'object' ? value._id || value.id || '' : value;
}

export interface HomeSectionItem {
  id: string;
  _id?: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  section_type: HomeSectionType;
  category_id?: CatalogRef | string | null;
  subcategory_id?: CatalogRef | string | null;
  brand_id?: CatalogRef | string | null;
  product_ids?: SectionProductRef[] | string[];
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HomeSectionInput {
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  section_type: HomeSectionType;
  category_id?: string | null;
  subcategory_id?: string | null;
  brand_id?: string | null;
  product_ids?: string[];
  sort_order?: number;
  is_active?: boolean;
}

/** The populated reference a section of this type points at, if any. */
export function sectionSource(s: HomeSectionItem): CatalogRef | null {
  const ref =
    s.section_type === 'category'
      ? s.category_id
      : s.section_type === 'subcategory'
      ? s.subcategory_id
      : s.section_type === 'brand'
      ? s.brand_id
      : null;
  return ref && typeof ref === 'object' ? ref : null;
}

// `api.*` already unwraps the `{ success, data }` envelope, so these return the
// payload directly — there is no extra `.data` to read.
export const homeSectionsService = {
  list(params: ListParams = {}): Promise<Paginated<HomeSectionItem>> {
    return apiList<HomeSectionItem>('/home-sections', params);
  },

  create(payload: HomeSectionInput): Promise<HomeSectionItem> {
    return api.post<HomeSectionItem>('/home-sections', payload);
  },

  update(id: string, payload: Partial<HomeSectionInput>): Promise<HomeSectionItem> {
    return api.patch<HomeSectionItem>(`/home-sections/${id}`, payload);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/home-sections/${id}`);
  },

  async reorder(ids: string[]): Promise<void> {
    await api.post('/home-sections/reorder', { ids });
  },
};
