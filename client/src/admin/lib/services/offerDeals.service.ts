import { api, apiList } from '../api';
import type { ListParams, Paginated } from '../types';
import type { SectionProductRef } from './homeSections.service';

export interface OfferDealItem {
  id: string;
  _id?: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  discount_label?: string | null;
  bg_gradient?: string;
  product_ids?: SectionProductRef[] | string[];
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

// `api.*` already unwraps the `{ success, data }` envelope.
export const offerDealsService = {
  list(params: ListParams = {}): Promise<Paginated<OfferDealItem>> {
    return apiList<OfferDealItem>('/offer-deals', params);
  },

  create(payload: OfferDealInput): Promise<OfferDealItem> {
    return api.post<OfferDealItem>('/offer-deals', payload);
  },

  update(id: string, payload: Partial<OfferDealInput>): Promise<OfferDealItem> {
    return api.patch<OfferDealItem>(`/offer-deals/${id}`, payload);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/offer-deals/${id}`);
  },
};
