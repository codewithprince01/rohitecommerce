import { api, apiList } from '../api';
import type { ListParams, Paginated, Coupon } from '../types';

/* ------------------------------- Types -------------------------------- */

export type CouponStatus = 'active' | 'scheduled' | 'expired' | 'disabled' | 'exhausted';

// A list row is a Coupon plus the live status + real redemption metrics the
// backend computes from orders.
export interface CouponRow extends Coupon {
  status: CouponStatus;
  redemptions: number;
  total_discount: number;
  revenue: number;
}

export interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  scheduledCoupons: number;
  expiredCoupons: number;
  disabledCoupons: number;
  exhaustedCoupons: number;
  expiringSoon: number;
  totalRedemptions: number;
  totalDiscountGiven: number;
  couponRevenue: number;
  avgDiscount: number;
}

export interface CouponInput {
  code: string;
  description?: string | null;
  type: 'percent' | 'fixed';
  value: number;
  min_order?: number;
  max_discount?: number | null;
  usage_limit?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active?: boolean;
}

/* ------------------------------ Queries ------------------------------- */

export function listCoupons(params: ListParams): Promise<Paginated<CouponRow>> {
  return apiList<CouponRow>('/coupons', params);
}

export function getCouponStats(): Promise<CouponStats> {
  return api.get<CouponStats>('/coupons/stats');
}

export function getCoupon(id: string): Promise<CouponRow> {
  return api.get<CouponRow>(`/coupons/${id}`);
}

/* ----------------------------- Mutations ------------------------------ */

export async function createCoupon(input: CouponInput): Promise<string> {
  const { id } = await api.post<{ id: string }>('/coupons', input);
  return id;
}

export async function updateCoupon(id: string, input: Partial<CouponInput>): Promise<void> {
  await api.patch(`/coupons/${id}`, input);
}

export async function deleteCoupon(id: string): Promise<void> {
  await api.delete(`/coupons/${id}`);
}

export async function bulkSetActive(ids: string[], isActive: boolean): Promise<void> {
  await api.post('/coupons/bulk/active', { ids, is_active: isActive });
}

export async function bulkDeleteCoupons(ids: string[]): Promise<void> {
  await api.post('/coupons/bulk/delete', { ids });
}

/* ------------------------------- Export ------------------------------- */

/**
 * Pages through every coupon matching the current filters and returns a CSV
 * string — real data only, no client-side fabrication.
 */
export async function exportCouponsCsv(params: ListParams): Promise<string> {
  const pageSize = 100;
  let page = 1;
  const all: CouponRow[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { rows, total } = await apiList<CouponRow>('/coupons', { ...params, page, pageSize });
    all.push(...rows);
    if (all.length >= total || rows.length === 0) break;
    page += 1;
  }

  const header = [
    'Code', 'Description', 'Type', 'Value', 'Min Order', 'Max Discount',
    'Used', 'Usage Limit', 'Redemptions', 'Discount Given', 'Revenue',
    'Status', 'Starts', 'Ends',
  ];
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = all.map((c) =>
    [
      c.code,
      c.description ?? '',
      c.type,
      c.value,
      c.min_order,
      c.max_discount ?? '',
      c.used_count,
      c.usage_limit ?? '',
      c.redemptions,
      c.total_discount,
      c.revenue,
      c.status,
      c.starts_at ? c.starts_at.slice(0, 10) : '',
      c.ends_at ? c.ends_at.slice(0, 10) : '',
    ]
      .map(escape)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
}
