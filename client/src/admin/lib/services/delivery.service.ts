import { api, apiList } from '../api';
import type { ListParams, Paginated } from '../types';

/* ------------------------------- Types -------------------------------- */

// A delivery zone enriched with real serviceability coverage.
export interface DeliveryZoneRow {
  id: string;
  name: string;
  pincodes: string[];
  fee: number;
  min_order: number;
  free_above: number | null;
  eta_minutes: number;
  is_active: boolean;
  created_at: string;
  pincode_count: number;
  addresses_covered: number;
  customers_covered: number;
}

export interface UncoveredPincode {
  pincode: string;
  addresses: number;
  customers: number;
}

export interface DuplicatePincode {
  pincode: string;
  zones: number;
}

export interface DeliveryStats {
  totalZones: number;
  activeZones: number;
  inactiveZones: number;
  freeDeliveryZones: number;
  avgFee: number;
  avgEta: number;
  pincodesCovered: number;
  activePincodesCovered: number;
  customersCovered: number;
  uncoveredPincodeCount: number;
  duplicatePincodeCount: number;
  uncoveredSample: UncoveredPincode[];
  duplicateSample: DuplicatePincode[];
}

export interface DeliveryZoneInput {
  name: string;
  pincodes: string[];
  fee: number;
  min_order: number;
  free_above: number | null;
  eta_minutes: number;
  is_active?: boolean;
}

/* ------------------------------ Queries ------------------------------- */

export function listDeliveryZones(params: ListParams): Promise<Paginated<DeliveryZoneRow>> {
  return apiList<DeliveryZoneRow>('/delivery', params);
}

export function getDeliveryStats(): Promise<DeliveryStats> {
  return api.get<DeliveryStats>('/delivery/stats');
}

/* ----------------------------- Mutations ------------------------------ */

export async function createDeliveryZone(input: DeliveryZoneInput): Promise<string> {
  const { id } = await api.post<{ id: string }>('/delivery', input);
  return id;
}

export async function updateDeliveryZone(id: string, input: Partial<DeliveryZoneInput>): Promise<void> {
  await api.patch(`/delivery/${id}`, input);
}

export async function deleteDeliveryZone(id: string): Promise<void> {
  await api.delete(`/delivery/${id}`);
}

export async function bulkSetActive(ids: string[], isActive: boolean): Promise<void> {
  await api.post('/delivery/bulk/active', { ids, is_active: isActive });
}

export async function bulkDeleteZones(ids: string[]): Promise<void> {
  await api.post('/delivery/bulk/delete', { ids });
}

/* ------------------------------- Export ------------------------------- */

/** Pages every zone matching the current filters into a CSV — real data only. */
export async function exportZonesCsv(params: ListParams): Promise<string> {
  const pageSize = 100;
  let page = 1;
  const all: DeliveryZoneRow[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { rows, total } = await apiList<DeliveryZoneRow>('/delivery', { ...params, page, pageSize });
    all.push(...rows);
    if (all.length >= total || rows.length === 0) break;
    page += 1;
  }

  const header = ['Zone', 'Pincodes', 'Fee', 'Min Order', 'Free Above', 'ETA (min)', 'Customers Covered', 'Status'];
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = all.map((z) =>
    [
      z.name,
      z.pincodes.join(' '),
      z.fee,
      z.min_order,
      z.free_above ?? '',
      z.eta_minutes,
      z.customers_covered,
      z.is_active ? 'Active' : 'Inactive',
    ]
      .map(escape)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
}
