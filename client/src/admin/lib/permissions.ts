import type { AdminRole } from './types';

// Permission strings are "<module>.<action>". Guards and the sidebar both
// consult can(role, permission) so UI and access checks never drift.
export type Permission =
  | 'dashboard.view'
  | 'products.view' | 'products.create' | 'products.update' | 'products.delete'
  | 'categories.view' | 'categories.manage'
  | 'inventory.view' | 'inventory.adjust'
  | 'orders.view' | 'orders.update' | 'orders.delete'
  | 'customers.view' | 'customers.manage'
  | 'coupons.view' | 'coupons.manage'
  | 'banners.view' | 'banners.manage'
  | 'delivery.view' | 'delivery.manage'
  | 'payments.view' | 'payments.manage'
  | 'reports.view'
  | 'notifications.view'
  | 'settings.view' | 'settings.manage'
  | 'admins.view' | 'admins.manage'
  | 'activity.view';

const ALL: Permission[] = [
  'dashboard.view',
  'products.view', 'products.create', 'products.update', 'products.delete',
  'categories.view', 'categories.manage',
  'inventory.view', 'inventory.adjust',
  'orders.view', 'orders.update', 'orders.delete',
  'customers.view', 'customers.manage',
  'coupons.view', 'coupons.manage',
  'banners.view', 'banners.manage',
  'delivery.view', 'delivery.manage',
  'payments.view', 'payments.manage',
  'reports.view',
  'notifications.view',
  'settings.view', 'settings.manage',
  'admins.view', 'admins.manage',
  'activity.view',
];

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: ALL,
  // Manager: everything except managing admin accounts & dangerous settings.
  manager: ALL.filter(
    (p) => !['admins.view', 'admins.manage', 'settings.manage'].includes(p)
  ),
  // Staff: read catalog/customers, fulfil orders, adjust stock. No deletes.
  staff: [
    'dashboard.view',
    'products.view',
    'categories.view',
    'inventory.view', 'inventory.adjust',
    'orders.view', 'orders.update',
    'customers.view',
    'coupons.view',
    'banners.view',
    'notifications.view',
  ],
};

export function permissionsFor(role: AdminRole | null | undefined): Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role] ?? [];
}

export function can(role: AdminRole | null | undefined, permission: Permission): boolean {
  return permissionsFor(role).includes(permission);
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  staff: 'Staff',
};
