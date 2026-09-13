import {
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  ShoppingCart,
  Users,
  Ticket,
  Image,
  Truck,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
  ScrollText,
  LucideIcon,
} from 'lucide-react';
import type { Permission } from '../../lib/permissions';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  permission: Permission;
  group: string;
}

// Single source of truth for the sidebar and route table.
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, permission: 'dashboard.view', group: 'Overview' },

  { label: 'Products', path: '/products', icon: Package, permission: 'products.view', group: 'Catalog' },
  { label: 'Categories', path: '/categories', icon: FolderTree, permission: 'categories.view', group: 'Catalog' },
  { label: 'Inventory', path: '/inventory', icon: Boxes, permission: 'inventory.view', group: 'Catalog' },

  { label: 'Orders', path: '/orders', icon: ShoppingCart, permission: 'orders.view', group: 'Sales' },
  { label: 'Customers', path: '/customers', icon: Users, permission: 'customers.view', group: 'Sales' },
  { label: 'Coupons', path: '/coupons', icon: Ticket, permission: 'coupons.view', group: 'Sales' },

  { label: 'Banners', path: '/banners', icon: Image, permission: 'banners.view', group: 'Marketing' },
  { label: 'Reports', path: '/reports', icon: BarChart3, permission: 'reports.view', group: 'Marketing' },

  { label: 'Delivery', path: '/delivery', icon: Truck, permission: 'delivery.view', group: 'Configuration' },
  { label: 'Payments', path: '/payments', icon: CreditCard, permission: 'payments.view', group: 'Configuration' },
  { label: 'Settings', path: '/settings', icon: Settings, permission: 'settings.view', group: 'Configuration' },

  { label: 'Notifications', path: '/notifications', icon: Bell, permission: 'notifications.view', group: 'System' },
  { label: 'Admin Users', path: '/admins', icon: ShieldCheck, permission: 'admins.view', group: 'System' },
  { label: 'Activity Logs', path: '/activity', icon: ScrollText, permission: 'activity.view', group: 'System' },
];

export const NAV_GROUPS = ['Overview', 'Catalog', 'Sales', 'Marketing', 'Configuration', 'System'];
