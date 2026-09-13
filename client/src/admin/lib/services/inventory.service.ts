import { api, apiList } from '../api';
import type { ListParams, Paginated } from '../types';

/* ------------------------------- Types -------------------------------- */

export type StockStatus = 'healthy' | 'low' | 'out';
export type MovementReason =
  | 'manual'
  | 'restock'
  | 'sale'
  | 'correction'
  | 'return'
  | 'damage'
  | 'stocktake'
  | 'transfer';

// One row = one SKU (product variant) with its valuation + demand signals.
export interface InventoryRow {
  id: string;
  quantity: string; // pack size label, e.g. "500g"
  price: number;
  original_price: number;
  stock: number;
  is_available: boolean;
  threshold: number;
  inventory_value: number;
  retail_value: number;
  sold_30d: number;
  days_of_cover: number | null;
  stock_status: StockStatus;
  last_movement_at: string | null;
  product_id: string;
  product: { id: string; name: string; image: string | null; is_available: boolean } | null;
  category: { id: string; name: string } | null;
}

export interface InventoryStats {
  totalSkus: number;
  totalUnits: number;
  inventoryValue: number;
  retailValue: number;
  potentialMargin: number;
  lowStock: number;
  outOfStock: number;
  healthy: number;
  inactiveSkus: number;
  deadStock: number;
  skusInStock: number;
  movements7d: number;
  unitsIn7d: number;
  unitsOut7d: number;
}

export interface StatusBucket {
  status: StockStatus;
  count: number;
  units: number;
  value: number;
}

export interface CategoryValue {
  id: string;
  name: string;
  value: number;
  units: number;
  skus: number;
}

export interface TrendPoint {
  date: string;
  in: number;
  out: number;
}

export interface ReorderItem {
  id: string;
  product_id: string;
  product_name: string;
  image: string | null;
  quantity: string;
  stock: number;
  threshold: number;
  sold_30d: number;
  days_of_cover: number | null;
  suggested_qty: number;
  status: 'low' | 'out';
}

export interface TopMover {
  id: string;
  product_name: string;
  variant_label: string | null;
  sold_30d: number;
  revenue: number;
}

export interface MovementFeedItem {
  id: string;
  variant_id: string | null;
  variant_label: string | null;
  change: number;
  resulting_stock: number | null;
  reason: MovementReason;
  note: string | null;
  created_at: string;
  created_by_email: string | null;
}

export interface InventoryAnalytics {
  statusDistribution: StatusBucket[];
  valueByCategory: CategoryValue[];
  movementTrend: TrendPoint[];
  reorderList: ReorderItem[];
  topMovers: TopMover[];
  recentMovements: MovementFeedItem[];
}

export interface MovementRow {
  id: string;
  variant_id: string;
  change: number;
  resulting_stock: number | null;
  reason: MovementReason;
  reference: string | null;
  note: string | null;
  created_by_email: string | null;
  created_at: string;
}

export interface AdjustInput {
  change?: number;
  set?: number;
  reason: MovementReason;
  note?: string | null;
  reference?: string | null;
  low_stock_threshold?: number;
}

/* ------------------------------ Queries ------------------------------- */

export function listInventory(params: ListParams): Promise<Paginated<InventoryRow>> {
  return apiList<InventoryRow>('/inventory', params);
}

export function getInventoryStats(): Promise<InventoryStats> {
  return api.get<InventoryStats>('/inventory/stats');
}

export function getInventoryAnalytics(): Promise<InventoryAnalytics> {
  return api.get<InventoryAnalytics>('/inventory/analytics');
}

export function variantMovements(variantId: string): Promise<MovementRow[]> {
  return api.get<MovementRow[]>(`/inventory/${variantId}/movements`);
}

/* ----------------------------- Mutations ------------------------------ */

export function adjustStock(variantId: string, input: AdjustInput): Promise<{ id: string; stock: number; low_stock_threshold: number }> {
  return api.post(`/inventory/${variantId}/adjust`, input);
}

export function bulkAdjustStock(input: {
  ids: string[];
  mode: 'add' | 'remove' | 'set';
  amount: number;
  reason: MovementReason;
  note?: string;
}): Promise<{ updated: number }> {
  return api.post('/inventory/bulk/adjust', input);
}

/* ------------------------------- Export ------------------------------- */

/**
 * Pages through the live inventory matching the current filters and returns a
 * CSV string — real data only, no client-side fabrication.
 */
export async function exportInventoryCsv(params: ListParams): Promise<string> {
  const pageSize = 100;
  let page = 1;
  const all: InventoryRow[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { rows, total } = await apiList<InventoryRow>('/inventory', { ...params, page, pageSize });
    all.push(...rows);
    if (all.length >= total || rows.length === 0) break;
    page += 1;
  }

  const header = [
    'Product', 'Pack', 'Category', 'Stock', 'Reorder Point', 'Status',
    'Price', 'Inventory Value', 'Sold (30d)', 'Days of Cover', 'Available',
  ];
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = all.map((r) =>
    [
      r.product?.name ?? '',
      r.quantity,
      r.category?.name ?? '',
      r.stock,
      r.threshold,
      r.stock_status,
      r.price,
      r.inventory_value,
      r.sold_30d,
      r.days_of_cover ?? '',
      r.is_available ? 'Yes' : 'No',
    ]
      .map(escape)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
}
