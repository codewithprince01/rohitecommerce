/**
 * Orders service — talks to the Express/MongoDB backend via `api.ts`.
 * No Supabase, no mock data: every read and write hits the real `/orders` API
 * and the live database.
 */
import { api, apiList } from '../api';
import type {
  ListParams,
  Paginated,
  Order,
  OrderItem,
  OrderStatus,
  OrderStatusHistory,
  PaymentStatus,
} from '../types';

/* ------------------------------- Types -------------------------------- */

export interface OrderStats {
  totalOrders: number;
  statusBreakdown: Record<OrderStatus, number>;
  pending: number;
  processing: number;
  outForDelivery: number;
  delivered: number;
  cancelled: number;
  returned: number;
  openOrders: number;
  revenue: number;
  paidRevenue: number;
  avgOrderValue: number;
  unpaidOrders: number;
  unpaidRevenue: number;
  todayOrders: number;
  todayRevenue: number;
}

/* ------------------------------ Queries ------------------------------- */

export function listOrders(params: ListParams): Promise<Paginated<Order>> {
  return apiList<Order>('/orders', params);
}

export function getOrderStats(): Promise<OrderStats> {
  return api.get<OrderStats>('/orders/stats');
}

export function getOrder(id: string): Promise<Order> {
  return api.get<Order>(`/orders/${id}`);
}

export function orderHistory(orderId: string): Promise<OrderStatusHistory[]> {
  return api.get<OrderStatusHistory[]>(`/orders/${orderId}/history`);
}

/* ----------------------------- Mutations ------------------------------ */

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string
): Promise<void> {
  await api.patch(`/orders/${orderId}/status`, { status, note: note ?? null });
}

export async function bulkUpdateStatus(
  ids: string[],
  status: OrderStatus,
  note?: string
): Promise<{ updated: number; skipped: Array<{ id: string; order_number: string; from: string }> }> {
  return api.post('/orders/bulk/status', { ids, status, note: note ?? null });
}

export async function updatePaymentStatus(
  orderId: string,
  payment_status: PaymentStatus
): Promise<void> {
  await api.patch(`/orders/${orderId}/payment`, { payment_status });
}

export interface NewOrderInput {
  customer_id: string | null;
  payment_method: Order['payment_method'];
  payment_status: Order['payment_status'];
  delivery_fee: number;
  discount: number;
  tax: number;
  notes?: string;
  delivery_address?: Record<string, unknown> | null;
  items: Array<Omit<OrderItem, 'id' | 'order_id' | 'created_at'>>;
}

export async function createOrder(input: NewOrderInput): Promise<string> {
  const { id } = await api.post<{ id: string }>('/orders', input);
  return id;
}

export async function deleteOrder(id: string): Promise<void> {
  await api.delete(`/orders/${id}`);
}

/* ------------------------------- Export ------------------------------- */

/**
 * Pages through every order matching the current filters and returns a CSV
 * string — real records only, assembled from the live API.
 */
export async function exportOrdersCsv(params: ListParams): Promise<string> {
  const pageSize = 100;
  let page = 1;
  const all: Order[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { rows, total } = await apiList<Order>('/orders', { ...params, page, pageSize });
    all.push(...rows);
    if (all.length >= total || rows.length === 0) break;
    page += 1;
  }

  const header = [
    'Order',
    'Placed',
    'Customer',
    'Email',
    'Phone',
    'Status',
    'Payment',
    'Method',
    'Subtotal',
    'Discount',
    'Delivery',
    'Tax',
    'Total',
  ];
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = all.map((o) =>
    [
      o.order_number,
      o.placed_at ? new Date(o.placed_at).toISOString() : '',
      o.customer?.name ?? 'Guest',
      o.customer?.email ?? '',
      o.customer?.phone ?? '',
      o.status,
      o.payment_status,
      o.payment_method,
      o.subtotal,
      o.discount,
      o.delivery_fee,
      o.tax,
      o.total,
    ]
      .map(escape)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
}
