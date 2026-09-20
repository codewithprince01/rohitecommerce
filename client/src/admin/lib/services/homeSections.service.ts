import { api } from '../api';
import type { Paginated } from '../types';

export interface HomeSectionItem {
  id: string;
  _id?: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  section_type: 'custom_products' | 'category';
  category_id?: {
    _id: string;
    name: string;
    slug: string;
  } | string | null;
  product_ids?: Array<{
    _id: string;
    id?: string;
    name: string;
    slug: string;
    price?: number;
    original_price?: number;
    image?: string;
  }> | string[];
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

export const homeSectionsService = {
  async list(params?: { search?: string; page?: number; pageSize?: number }): Promise<Paginated<HomeSectionItem>> {
    const res = await api.get<Paginated<HomeSectionItem>>('/home-sections', { params });
    return res.data;
  },

  async create(payload: HomeSectionInput): Promise<HomeSectionItem> {
    const res = await api.post<HomeSectionItem>('/home-sections', payload);
    return res.data;
  },

  async update(id: string, payload: Partial<HomeSectionInput>): Promise<HomeSectionItem> {
    const res = await api.patch<HomeSectionItem>(`/home-sections/${id}`, payload);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/home-sections/${id}`);
  },

  async reorder(ids: string[]): Promise<void> {
    await api.post('/home-sections/reorder', { ids });
  },
};
