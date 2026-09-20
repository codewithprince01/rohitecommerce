const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

export interface CustomerProfileData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar?: string | null;
  gender?: string | null;
  dob?: string | null;
  alternate_phone?: string | null;
  preferences?: Record<string, any>;
  wallet_balance: number;
  cashback_earned: number;
  is_vip: boolean;
  freshpass_expiry: string;
  notes?: string | null;
  counts: {
    saved_addresses: number;
    active_orders: number;
    available_coupons: number;
  };
  addresses: AddressItem[];
}

export interface AddressItem {
  _id: string;
  customer_id?: string;
  label: string;
  receiver_name?: string | null;
  receiver_phone?: string | null;
  line1: string;
  line2?: string | null;
  landmark?: string | null;
  city: string;
  state?: string | null;
  pincode: string;
  delivery_instructions?: string[];
  is_default: boolean;
}

export interface OrderItemData {
  _id: string;
  order_id: string;
  product_id?: string;
  variant_id?: string;
  product_name: string;
  variant_label?: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  image?: string;
}

export interface OrderData {
  _id: string;
  id?: string;
  order_number: string;
  customer_id?: string;
  status: 'pending' | 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cod_pending' | 'cod_collected' | 'cancelled';
  payment_method: 'cod' | 'card' | 'upi' | 'wallet';
  subtotal: number;
  discount: number;
  delivery_fee: number;
  tax: number;
  total: number;
  delivery_address?: {
    label?: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    pincode: string;
  };
  notes?: string | null;
  placed_at: string;
  items: OrderItemData[];
  rider?: {
    name: string;
    phone: string;
    rating: number;
    trips?: number;
    vehicle: string;
    photo: string;
  };
  delivery_eta?: string;
  rating?: number | null;
  rating_review?: string | null;
  rating_tags?: string[];
}

export interface WalletTransactionItem {
  _id: string;
  customer_id: string;
  type: 'credit' | 'debit';
  title: string;
  amount: number;
  description?: string | null;
  reference_id?: string | null;
  created_at: string;
}

export interface WalletData {
  balance: number;
  cashback_earned: number;
  transactions: WalletTransactionItem[];
}

export interface CouponItem {
  _id: string;
  code: string;
  description?: string | null;
  type: 'percent' | 'fixed';
  value: number;
  min_order?: number;
  max_discount?: number;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active: boolean;
}

export interface SupportTicketItem {
  _id: string;
  ticket_number: string;
  category: string;
  order_number?: string | null;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  responses: Array<{
    sender: 'customer' | 'agent';
    message: string;
    created_at: string;
  }>;
  created_at: string;
}

export async function fetchProfile(): Promise<CustomerProfileData> {
  const res = await fetch(`${API_BASE}/customer/me`);
  if (!res.ok) throw new Error('Failed to load profile');
  const json = await res.json();
  return json.data;
}

export async function updateProfile(data: { name?: string; email?: string; phone?: string; [key: string]: any }): Promise<any> {
  const res = await fetch(`${API_BASE}/customer/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export async function fetchOrders(): Promise<OrderData[]> {
  const res = await fetch(`${API_BASE}/customer/orders`);
  if (!res.ok) throw new Error('Failed to load orders');
  const json = await res.json();
  return json.data;
}

export async function createCustomerOrder(data: any): Promise<any> {
  const res = await fetch(`${API_BASE}/customer/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || 'Failed to place order');
  }
  return res.json();
}

export async function cancelOrder(orderId: string, reason?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/customer/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to cancel order');
  return json;
}

export async function reorderItems(orderId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/customer/orders/${orderId}/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to reorder items');
  return json;
}

export async function rateOrder(
  orderId: string,
  rating: number,
  review?: string,
  tags?: string[]
): Promise<any> {
  const res = await fetch(`${API_BASE}/customer/orders/${orderId}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, review, tags }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to rate order');
  return json;
}

export async function fetchAddresses(): Promise<AddressItem[]> {
  const res = await fetch(`${API_BASE}/customer/addresses`);
  if (!res.ok) throw new Error('Failed to load addresses');
  const json = await res.json();
  return json.data;
}

export async function addAddress(address: Partial<AddressItem>): Promise<AddressItem> {
  const res = await fetch(`${API_BASE}/customer/addresses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(address),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to add address');
  return json.data;
}

export async function updateAddress(id: string, address: Partial<AddressItem>): Promise<AddressItem> {
  const res = await fetch(`${API_BASE}/customer/addresses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(address),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update address');
  return json.data;
}

export async function deleteAddress(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/customer/addresses/${id}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete address');
  return json;
}

export async function setDefaultAddress(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/customer/addresses/${id}/default`, {
    method: 'PATCH',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to set default address');
  return json;
}

export async function fetchWallet(): Promise<WalletData> {
  const res = await fetch(`${API_BASE}/customer/wallet`);
  if (!res.ok) throw new Error('Failed to load wallet');
  const json = await res.json();
  return json.data;
}

export async function topupWallet(amount: number): Promise<any> {
  const res = await fetch(`${API_BASE}/customer/wallet/topup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to top up wallet');
  return json;
}

export async function fetchCoupons(): Promise<CouponItem[]> {
  const res = await fetch(`${API_BASE}/customer/coupons`);
  if (!res.ok) throw new Error('Failed to load coupons');
  const json = await res.json();
  return json.data;
}

export async function applyCoupon(code: string, cartTotal?: number): Promise<any> {
  const res = await fetch(`${API_BASE}/customer/coupons/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, cart_total: cartTotal }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to apply coupon');
  return json;
}

export async function fetchSupportTickets(): Promise<SupportTicketItem[]> {
  const res = await fetch(`${API_BASE}/customer/support`);
  if (!res.ok) throw new Error('Failed to load support tickets');
  const json = await res.json();
  return json.data;
}

export async function createSupportTicket(data: {
  category: string;
  subject: string;
  message: string;
  order_number?: string;
}): Promise<SupportTicketItem> {
  const res = await fetch(`${API_BASE}/customer/support`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create support ticket');
  return json.data;
}

export async function replySupportTicket(id: string, message: string): Promise<any> {
  const res = await fetch(`${API_BASE}/customer/support/${id}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to send reply');
  return json;
}

export async function logoutCustomer(): Promise<any> {
  const res = await fetch(`${API_BASE}/customer/logout`, { method: 'POST' });
  return res.json();
}
