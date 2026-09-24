import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ToastProvider } from './hooks/useToast';
import { ConfirmProvider } from './hooks/useConfirm';
import { RequireAuth, RequirePermission } from './components/guards/Guards';
import AdminLayout from './components/layout/AdminLayout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/products/ProductsPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import InventoryPage from './pages/inventory/InventoryPage';
import OrdersPage from './pages/orders/OrdersPage';
import OrderDetailPage from './pages/orders/OrderDetailPage';
import CustomersPage from './pages/customers/CustomersPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import BannersPage from './pages/banners/BannersPage';
import HomeSectionsPage from './pages/homeSections/HomeSectionsPage';
import OffersManagePage from './pages/offers/OffersManagePage';
import DeliveryPage from './pages/delivery/DeliveryPage';
import ReportsPage from './pages/reports/ReportsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import SettingsPage from './pages/settings/SettingsPage';
import AdminUsersPage from './pages/admins/AdminUsersPage';
import ActivityLogPage from './pages/activity/ActivityLogPage';
import type { Permission } from './lib/permissions';

function Protected({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  return <RequirePermission permission={permission}>{children}</RequirePermission>;
}

export default function AdminApp() {
  return (
    <BrowserRouter basename="/admin">
      <AdminAuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <RequireAuth>
                    <AdminLayout />
                  </RequireAuth>
                }
              >
                <Route path="/" element={<Protected permission="dashboard.view"><DashboardPage /></Protected>} />
                <Route path="/products" element={<Protected permission="products.view"><ProductsPage /></Protected>} />
                <Route path="/categories" element={<Protected permission="categories.view"><CategoriesPage /></Protected>} />
                <Route path="/inventory" element={<Protected permission="inventory.view"><InventoryPage /></Protected>} />
                <Route path="/orders" element={<Protected permission="orders.view"><OrdersPage /></Protected>} />
                <Route path="/orders/:id" element={<Protected permission="orders.view"><OrderDetailPage /></Protected>} />
                <Route path="/customers" element={<Protected permission="customers.view"><CustomersPage /></Protected>} />
                <Route path="/customers/:id" element={<Protected permission="customers.view"><CustomerDetailPage /></Protected>} />
                <Route path="/home-sections" element={<Protected permission="homeSections.view"><HomeSectionsPage /></Protected>} />
                <Route path="/offers-manage" element={<Protected permission="offers.view"><OffersManagePage /></Protected>} />
                <Route path="/banners" element={<Protected permission="banners.view"><BannersPage /></Protected>} />
                <Route path="/reports" element={<Protected permission="reports.view"><ReportsPage /></Protected>} />
                <Route path="/delivery" element={<Protected permission="delivery.view"><DeliveryPage /></Protected>} />
                <Route path="/settings" element={<Protected permission="settings.view"><SettingsPage /></Protected>} />
                <Route path="/notifications" element={<Protected permission="notifications.view"><NotificationsPage /></Protected>} />
                <Route path="/admins" element={<Protected permission="admins.view"><AdminUsersPage /></Protected>} />
                <Route path="/activity" element={<Protected permission="activity.view"><ActivityLogPage /></Protected>} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ConfirmProvider>
        </ToastProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}
