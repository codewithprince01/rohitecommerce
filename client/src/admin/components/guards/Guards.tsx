import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader } from '../ui/States';
import { EmptyState } from '../ui/States';
import { ShieldX } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import type { Permission } from '../../lib/permissions';

// Gate the whole admin behind authentication.
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader label="Loading console…" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

// Gate a route behind a specific permission.
export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: React.ReactNode;
}) {
  const { can } = useAdminAuth();
  if (!can(permission)) {
    return (
      <EmptyState
        icon={ShieldX}
        title="Access denied"
        message="You don't have permission to view this section. Contact a super admin if you believe this is a mistake."
      />
    );
  }
  return <>{children}</>;
}
