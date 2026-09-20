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

export interface HomeSectionItem {
  id: string;
  _id?: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  section_type: 'custom_products' | 'category';
  category_id?: { _id: string; id?: string; name: string; slug: string } | string | null;
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
  section_type: 'custom_products' | 'category';
  category_id?: string | null;
  product_ids?: string[];
  sort_order?: number;
  is_active?: boolean;
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
