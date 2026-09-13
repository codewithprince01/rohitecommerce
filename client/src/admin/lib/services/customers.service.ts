/**
 * Customers service — talks to the Express/MongoDB backend via `api.ts`.
 * No Supabase, no mock data: every read and write hits the real `/customers`
 * API and the live database.
 */
import { api, apiList } from '../api';
import type { ListParams, Paginated, Customer, Address, Order } from '../types';

/* ------------------------------- Types -------------------------------- */

/** A customer row enriched with real order rollups (computed server-side). */
export interface CustomerRow extends Customer {
  orders_count: number;
  total_spent: number;
  last_order_at: string | null;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  blockedCustomers: number;
  newCustomers: number;
  withOrders: number;
  repeatCustomers: number;
  totalLifetimeValue: number;
  avgLifetimeValue: number;
}

export interface CustomerDetail {
  customer: Customer;
  addresses: Address[];
  orders: Order[];
  stats: {
    totalOrders: number;
    validOrders: number;
    lifetimeValue: number;
    avgOrderValue: number;
    firstOrderAt: string | null;
    lastOrderAt: string | null;
  };
}

/* ------------------------------ Queries ------------------------------- */

export function listCustomers(params: ListParams): Promise<Paginated<CustomerRow>> {
  return apiList<CustomerRow>('/customers', params);
}

export function getCustomerStats(): Promise<CustomerStats> {
  return api.get<CustomerStats>('/customers/stats');
}

export function getCustomerDetail(id: string): Promise<CustomerDetail> {
  return api.get<CustomerDetail>(`/customers/${id}`);
}

/* ----------------------------- Mutations ------------------------------ */

export async function createCustomer(values: Partial<Customer>): Promise<Customer> {
  return api.post<Customer>('/customers', {
    name: values.name,
    email: values.email ?? null,
    phone: values.phone ?? null,
    notes: values.notes ?? null,
  });
}

export async function updateCustomer(id: string, values: Partial<Customer>): Promise<Customer> {
  return api.patch<Customer>(`/customers/${id}`, {
    name: values.name,
    email: values.email ?? null,
    phone: values.phone ?? null,
    notes: values.notes ?? null,
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  await api.delete(`/customers/${id}`);
}

export async function toggleBlock(id: string, isBlocked: boolean): Promise<void> {
  await api.patch(`/customers/${id}`, { is_blocked: isBlocked });
}

export async function bulkBlock(ids: string[], isBlocked: boolean): Promise<void> {
  await api.post('/customers/bulk/block', { ids, is_blocked: isBlocked });
}

export async function bulkDelete(ids: string[]): Promise<void> {
  await api.post('/customers/bulk/delete', { ids });
}

/* ------------------------------- Export ------------------------------- */

/**
 * Pages through every customer matching the current filters and returns a CSV
 * string — real records only, assembled from the live API.
 */
export async function exportCustomersCsv(params: ListParams): Promise<string> {
  const pageSize = 100;
  let page = 1;
  const all: CustomerRow[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { rows, total } = await apiList<CustomerRow>('/customers', { ...params, page, pageSize });
    all.push(...rows);
    if (all.length >= total || rows.length === 0) break;
    page += 1;
  }

  const header = ['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Last Order', 'Status', 'Joined'];
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = all.map((c) =>
    [
      c.name,
      c.email ?? '',
      c.phone ?? '',
      c.orders_count,
      c.total_spent,
      c.last_order_at ? new Date(c.last_order_at).toISOString().slice(0, 10) : '',
      c.is_blocked ? 'Blocked' : 'Active',
      c.created_at ? new Date(c.created_at).toISOString().slice(0, 10) : '',
    ]
      .map(escape)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
}
