/**
 * Banners service — talks to the Express/MongoDB backend via `api.ts`.
 * No Supabase, no mock data: every read and write hits the real `/banners` API
 * and the live database.
 */
import { api, apiList } from '../api';
import type { ListParams, Paginated, Banner } from '../types';

export type BannerStatus = 'live' | 'scheduled' | 'expired' | 'hidden';

/** A banner row with its server-computed lifecycle status. */
export interface BannerRow extends Banner {
  status: BannerStatus;
}

export interface BannerStats {
  total: number;
  live: number;
  scheduled: number;
  expired: number;
  hidden: number;
  byPosition: Record<string, number>;
}

/* ------------------------------ Queries ------------------------------- */

export function listBanners(params: ListParams): Promise<Paginated<BannerRow>> {
  return apiList<BannerRow>('/banners', params);
}

export function getBannerStats(): Promise<BannerStats> {
  return api.get<BannerStats>('/banners/stats');
}

export function getBanner(id: string): Promise<BannerRow> {
  return api.get<BannerRow>(`/banners/${id}`);
}

/* ----------------------------- Mutations ------------------------------ */

function payload(values: Partial<Banner>) {
  return {
    title: values.title,
    subtitle: values.subtitle ?? null,
    image: values.image ?? null,
    bg_color: values.bg_color ?? 'bg-primary-500',
    link_type: values.link_type ?? 'none',
    link_value: values.link_value ?? null,
    position: values.position ?? 'home_hero',
    sort_order: values.sort_order ?? 0,
    starts_at: values.starts_at || null,
    ends_at: values.ends_at || null,
    is_active: values.is_active ?? true,
  };
}

export async function createBanner(values: Partial<Banner>): Promise<Banner> {
  return api.post<Banner>('/banners', payload(values));
}

export async function updateBanner(id: string, values: Partial<Banner>): Promise<Banner> {
  return api.patch<Banner>(`/banners/${id}`, payload(values));
}

export async function deleteBanner(id: string): Promise<void> {
  await api.delete(`/banners/${id}`);
}

export async function reorderBanners(items: Array<{ id: string; sort_order: number }>): Promise<void> {
  await api.post('/banners/reorder', { items });
}

export async function bulkBanners(
  ids: string[],
  action: 'activate' | 'deactivate' | 'delete'
): Promise<void> {
  await api.post('/banners/bulk', { ids, action });
}
