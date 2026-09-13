import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api, tokenStore, ApiError } from '../lib/api';
import type { AdminUser } from '../lib/types';
import { can as canDo, type Permission } from '../lib/permissions';
import { setAuditAdmin } from '../lib/audit';

interface AuthState {
  loading: boolean;
  admin: AdminUser | null;
  error: string | null;
}

interface AdminAuthContextType {
  loading: boolean;
  admin: AdminUser | null;
  error: string | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  can: (permission: Permission) => boolean;
}

interface AuthPayload {
  admin: AdminUser;
  permissions: Permission[];
}

interface LoginPayload extends AuthPayload {
  accessToken: string;
  refreshToken: string;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ loading: true, admin: null, error: null });

  // On mount, restore the session from a stored token (if any).
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!tokenStore.access) {
        if (mounted) setState({ loading: false, admin: null, error: null });
        return;
      }
      try {
        const { admin } = await api.get<AuthPayload>('/auth/me');
        if (!mounted) return;
        setAuditAdmin({ id: admin.id, email: admin.email });
        setState({ loading: false, admin, error: null });
      } catch {
        tokenStore.clear();
        if (mounted) setState({ loading: false, admin: null, error: null });
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, error: null }));
    try {
      const data = await api.post<LoginPayload>('/auth/login', { email, password }, { auth: false });
      tokenStore.set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      setAuditAdmin({ id: data.admin.id, email: data.admin.email });
      setState({ loading: false, admin: data.admin, error: null });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Sign-in failed';
      setState({ loading: false, admin: null, error: msg });
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Best-effort; tokens are cleared regardless.
    }
    tokenStore.clear();
    setAuditAdmin(null);
    setState({ loading: false, admin: null, error: null });
  }, []);

  const can = useCallback((permission: Permission) => canDo(state.admin?.role, permission), [state.admin]);

  return (
    <AdminAuthContext.Provider
      value={{
        loading: state.loading,
        admin: state.admin,
        error: state.error,
        isAuthenticated: !!state.admin,
        signIn,
        signOut,
        can,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
