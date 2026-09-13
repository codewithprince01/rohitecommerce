import { api, apiList } from '../api';
import type { OrderStatus, PaymentMethod } from '../types';

/* ------------------------------- Types -------------------------------- */

export interface Metric {
  value: number;
  prev: number;
  changePct: number | null;
}

export interface DayPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface WeekdayPoint {
  weekday: number; // 1=Sun … 7=Sat (Mongo $dayOfWeek)
  revenue: number;
  orders: number;
}

export interface CategorySales {
  id: string;
  name: string;
  revenue: number;
  qty: number;
}

export interface TopProduct {
  name: string;
  qty: number;
  revenue: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  orders: number;
  total: number;
}

export interface PaymentSplitRow {
  method: PaymentMethod | string;
  total: number;
  orders: number;
}

export interface ReportData {
  range: { from: string; to: string; days: number };
  revenue: Metric;
  orders: Metric;
  avgOrderValue: Metric;
  itemsSold: Metric;
  newCustomers: Metric;
  discounts: Metric;
  composition: { subtotal: number; discount: number; delivery: number; tax: number; total: number };
  cancelledCount: number;
  cancelledRevenue: number;
  validOrders: number;
  fulfilledRate: number;
  byDay: DayPoint[];
  byWeekday: WeekdayPoint[];
  statusBreakdown: Partial<Record<OrderStatus, number>>;
  paymentSplit: PaymentSplitRow[];
  salesByCategory: CategorySales[];
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
}

/* ------------------------------ Queries ------------------------------- */

/** One call → the full analytics payload for the [from, to] window. */
export function getReport(fromISO: string, toISO: string): Promise<ReportData> {
  return api.get<ReportData>('/reports', { from: fromISO, to: toISO });
}

/* ------------------------------- Export ------------------------------- */

interface OrderExportRow {
  order_number: string;
  placed_at: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  tax: number;
  total: number;
}

/**
 * Pages the real orders endpoint over the date range and returns an order-level
 * CSV — no client-side fabrication, only what the backend returns.
 */
export async function exportOrdersCsv(fromISO: string, toISO: string): Promise<string> {
  const pageSize = 100;
  let page = 1;
  const all: OrderExportRow[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { rows, total } = await apiList<OrderExportRow>('/orders', {
      page,
      pageSize,
      filters: { from: fromISO, to: toISO },
      sortBy: 'placed_at',
      sortDir: 'asc',
    });
    all.push(...rows);
    if (all.length >= total || rows.length === 0) break;
    page += 1;
  }

  const rows = all.map((o) => ({
    order_number: o.order_number,
    date: o.placed_at,
    status: o.status,
    payment_status: o.payment_status,
    payment_method: o.payment_method,
    subtotal: o.subtotal,
    discount: o.discount,
    delivery_fee: o.delivery_fee,
    tax: o.tax,
    total: o.total,
  }));
  return toCsv(rows);
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))];
  return lines.join('\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
