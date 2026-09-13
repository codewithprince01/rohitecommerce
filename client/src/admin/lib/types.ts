// Admin-side domain types. The shared supabase client is untyped (created
// without a Database generic), so queries return `any` and we cast to these.

export type AdminRole = 'super_admin' | 'manager' | 'staff';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packed'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cod' | 'card' | 'upi' | 'wallet';

export interface Customer {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  is_blocked: boolean;
  notes: string | null;
  created_at: string;
}

export interface Address {
  id: string;
  customer_id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  pincode: string;
  is_default: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_label: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  tax: number;
  total: number;
  coupon_id: string | null;
  coupon_code: string | null;
  delivery_address: Record<string, unknown> | null;
  notes: string | null;
  placed_at: string;
  created_at: string;
  customer?: Customer | null;
  items?: OrderItem[];
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: 'percent' | 'fixed';
  value: number;
  min_order: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

export type BannerLinkType = 'none' | 'category' | 'subcategory' | 'brand' | 'product' | 'url';

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  bg_color: string;
  link_type: BannerLinkType;
  link_value: string | null;
  position: string;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface InventoryMovement {
  id: string;
  variant_id: string;
  change: number;
  resulting_stock: number | null;
  reason: 'manual' | 'restock' | 'sale' | 'correction' | 'return' | 'damage';
  reference: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  pincodes: string[];
  fee: number;
  min_order: number;
  free_above: number | null;
  eta_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface PaymentMethodRow {
  id: string;
  name: string;
  code: string;
  is_enabled: boolean;
  config: Record<string, unknown>;
  sort_order: number;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  type: 'info' | 'order' | 'stock' | 'customer' | 'system';
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  admin_user_id: string | null;
  admin_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// Generic paginated result returned by every list service.
export interface Paginated<T> {
  rows: T[];
  total: number;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  filters?: Record<string, string | number | boolean | null | undefined>;
}
