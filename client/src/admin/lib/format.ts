import type { OrderStatus, PaymentStatus, PaymentMethod } from './types';

export function formatCurrency(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(value: string | null | undefined): string {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString().slice(-6);
  const rnd = Math.floor(Math.random() * 900 + 100);
  return `GRO${ts}${rnd}`;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending (Order Aaya)',
  confirmed: 'Confirmed (Accepted)',
  packed: 'Packed (Pack Ho Gaya)',
  out_for_delivery: 'On the Way (Raste Me Hai)',
  delivered: 'Delivered (Deliver Ho Gaya)',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export const ORDER_STATUS_SHORT_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  packed: 'Packed',
  out_for_delivery: 'On the Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

// Tailwind classes for status badges, aligned with FreshMart palette.
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  packed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  out_for_delivery: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
  returned: 'bg-neutral-200 text-neutral-800 border-neutral-300',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: 'Cash on Delivery',
  card: 'Card',
  upi: 'UPI',
  wallet: 'Wallet',
};

export function formatCompactCurrency(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return formatCurrency(n);
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-primary-100 text-primary-700',
  failed: 'bg-rose-100 text-rose-700',
  refunded: 'bg-neutral-200 text-neutral-700',
};

// Allowed forward/lateral transitions for the order workflow.
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'],
  confirmed: ['packed', 'out_for_delivery', 'delivered', 'cancelled'],
  packed: ['out_for_delivery', 'delivered', 'confirmed', 'cancelled'],
  out_for_delivery: ['delivered', 'packed', 'cancelled'],
  delivered: ['returned', 'out_for_delivery'],
  cancelled: ['pending', 'confirmed'],
  returned: [],
};
