/**
 * Payments service — talks to the Express/MongoDB backend via `api.ts`.
 * No Supabase, no mock data. Payment transactions are real orders projected as
 * a reconciliation ledger; payment methods come from the live config.
 */
import { api, apiList } from '../api';
import type {
  ListParams,
  Paginated,
  PaymentMethodRow,
  PaymentStatus,
  PaymentMethod,
  OrderStatus,
} from '../types';

/* ------------------------------- Types -------------------------------- */

export interface PaymentTransaction {
  id: string;
  order_id: string;
  order_number: string;
  customer: { id: string; name: string; email: string | null } | null;
  amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  order_status: OrderStatus;
  placed_at: string;
}

export interface PaymentMethodBreakdown {
  method: PaymentMethod;
  orders: number;
  amount: number;
  collected: number;
}

export interface PaymentStats {
  collected: number;
  collectedOrders: number;
  pending: number;
  pendingOrders: number;
  failed: number;
  failedOrders: number;
  refunded: number;
  refundedOrders: number;
  codDue: number;
  codDueOrders: number;
  grossSales: number;
  grossOrders: number;
  outstanding: number;
  collectionRate: number;
  byMethod: PaymentMethodBreakdown[];
  byStatus: Record<string, { orders: number; amount: number }>;
}

/* ------------------------------ Queries ------------------------------- */

export function listPayments(params: ListParams): Promise<Paginated<PaymentTransaction>> {
  return apiList<PaymentTransaction>('/payments', params);
}

export function getPaymentStats(): Promise<PaymentStats> {
  return api.get<PaymentStats>('/payments/stats');
}

export function listPaymentMethods(): Promise<PaymentMethodRow[]> {
  return api.get<PaymentMethodRow[]>('/payments/methods');
}

/* ----------------------------- Mutations ------------------------------ */

export async function togglePaymentMethod(id: string, isEnabled: boolean): Promise<void> {
  await api.patch(`/payments/methods/${id}`, { is_enabled: isEnabled });
}

export async function updatePaymentMethod(
  id: string,
  patch: Partial<Pick<PaymentMethodRow, 'name' | 'is_enabled' | 'sort_order'>>
): Promise<void> {
  await api.patch(`/payments/methods/${id}`, patch);
}

export async function updateTransactionStatus(
  orderId: string,
  paymentStatus: PaymentStatus
): Promise<void> {
  await api.patch(`/payments/transactions/${orderId}`, { payment_status: paymentStatus });
}

/* ------------------------------- Export ------------------------------- */

export async function exportPaymentsCsv(params: ListParams): Promise<string> {
  const pageSize = 100;
  let page = 1;
  const all: PaymentTransaction[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { rows, total } = await apiList<PaymentTransaction>('/payments', { ...params, page, pageSize });
    all.push(...rows);
    if (all.length >= total || rows.length === 0) break;
    page += 1;
  }

  const header = ['Order', 'Placed', 'Customer', 'Method', 'Amount', 'Payment Status', 'Order Status'];
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = all.map((t) =>
    [
      t.order_number,
      t.placed_at ? new Date(t.placed_at).toISOString() : '',
      t.customer?.name ?? 'Guest',
      t.payment_method,
      t.amount,
      t.payment_status,
      t.order_status,
    ]
      .map(escape)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
}
