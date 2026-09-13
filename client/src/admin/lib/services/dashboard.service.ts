import { api } from '../api';
import type { Order, OrderStatus, PaymentMethod, ActivityLog } from '../types';

/** Selectable comparison windows for the dashboard. Value is the length in days. */
export type RangeKey = '7d' | '30d' | '90d';

export const RANGE_DAYS: Record<RangeKey, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export const RANGE_LABELS: Record<RangeKey, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
};

/** A point-in-time metric with its previous-period comparison baked in. */
export interface Metric {
  value: number;
  prev: number;
  /** Signed percentage change vs previous period (null when previous is 0). */
  changePct: number | null;
}

export interface SalesPoint {
  date: string;
  revenue: number;
  orders: number;
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

export interface PaymentSplit {
  method: PaymentMethod;
  orders: number;
  total: number;
}

export interface LowStockItem {
  id: string; // variant id
  productName: string;
  variantLabel: string;
  stock: number;
  productId: string;
}

export interface DashboardStats {
  range: RangeKey;
  // Period KPIs (with previous-period comparison)
  revenue: Metric;
  orders: Metric;
  avgOrderValue: Metric;
  newCustomers: Metric;
  // Operational, current-state counters (not period-bound)
  pendingOrders: number;
  processingOrders: number; // confirmed + packed
  outForDelivery: number;
  totalCustomers: number;
  lowStockCount: number;
  outOfStockCount: number;
  unpaidRevenue: number; // value of non-cancelled orders still awaiting payment
  unpaidOrders: number;
  unreadNotifications: number;
  // Breakdowns (within selected period)
  statusBreakdown: Record<OrderStatus, number>;
  paymentSplit: PaymentSplit[];
  salesByDay: SalesPoint[];
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
  recentOrders: Order[];
  lowStockItems: LowStockItem[];
  recentActivity: ActivityLog[];
  fulfilledRate: number; // delivered / valid orders in period (0–100)
}

/**
 * Fetches the full dashboard payload from the backend. The API computes every
 * KPI, breakdown and list server-side (see server dashboard.controller.js) and
 * returns this exact shape, so the page just renders it.
 */
export async function getDashboardStats(range: RangeKey = '7d'): Promise<DashboardStats> {
  return api.get<DashboardStats>('/dashboard', { range });
}
