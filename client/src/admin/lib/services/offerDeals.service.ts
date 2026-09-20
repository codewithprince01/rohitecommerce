import { api } from '../api';
import type { Paginated } from '../types';

export interface OfferDealItem {
  id: string;
  _id?: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  discount_label?: string | null;
  bg_gradient?: string;
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
}

export interface OfferDealInput {
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  discount_label?: string | null;
  bg_gradient?: string;
  product_ids?: string[];
  sort_order?: number;
  is_active?: boolean;
}

export const offerDealsService = {
  async list(params?: { search?: string; page?: number; pageSize?: number }): Promise<Paginated<OfferDealItem>> {
    const res = await api.get<Paginated<OfferDealItem>>('/offer-deals', { params });
    return res.data;
  },

  async create(payload: OfferDealInput): Promise<OfferDealItem> {
    const res = await api.post<OfferDealItem>('/offer-deals', payload);
    return res.data;
  },

  async update(id: string, payload: Partial<OfferDealInput>): Promise<OfferDealItem> {
    const res = await api.patch<OfferDealItem>(`/offer-deals/${id}`, payload);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/offer-deals/${id}`);
  },
};
