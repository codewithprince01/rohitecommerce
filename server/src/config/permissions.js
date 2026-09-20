// Server-side mirror of the frontend permission matrix (src/admin/lib/permissions.ts).
// Keep these in sync so UI affordances and API access never drift.

export const ALL_PERMISSIONS = [
  'dashboard.view',
  'products.view', 'products.create', 'products.update', 'products.delete',
  'categories.view', 'categories.manage',
  'inventory.view', 'inventory.adjust',
  'orders.view', 'orders.update', 'orders.delete',
  'customers.view', 'customers.manage',
  'coupons.view', 'coupons.manage',
  'banners.view', 'banners.manage',
  'homeSections.view', 'homeSections.manage',
  'offers.view', 'offers.manage',
  'delivery.view', 'delivery.manage',
  'payments.view', 'payments.manage',
  'reports.view',
  'notifications.view',
  'settings.view', 'settings.manage',
  'admins.view', 'admins.manage',
  'activity.view',
];

export const ROLE_PERMISSIONS = {
  super_admin: ALL_PERMISSIONS,
  manager: ALL_PERMISSIONS.filter(
    (p) => !['admins.view', 'admins.manage', 'settings.manage'].includes(p)
  ),
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

export function permissionsFor(role) {
  return ROLE_PERMISSIONS[role] || [];
}

export function can(role, permission) {
  return permissionsFor(role).includes(permission);
}
