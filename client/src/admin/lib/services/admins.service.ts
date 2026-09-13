import { api, apiList } from '../api';
import type { ListParams, Paginated, AdminUser, AdminRole } from '../types';

/* ------------------------------- Types -------------------------------- */

export interface AdminStats {
  totalAdmins: number;
  activeAdmins: number;
  disabledAdmins: number;
  superAdmins: number;
  managers: number;
  staff: number;
  recentlyActive: number;
  neverLoggedIn: number;
}

export interface AdminInput {
  email: string;
  password: string;
  full_name?: string;
  role: AdminRole;
}

/* ------------------------------ Queries ------------------------------- */

export function listAdmins(params: ListParams): Promise<Paginated<AdminUser>> {
  return apiList<AdminUser>('/admins', params);
}

export function getAdminStats(): Promise<AdminStats> {
  return api.get<AdminStats>('/admins/stats');
}

/* ----------------------------- Mutations ------------------------------ */

export async function createAdmin(input: AdminInput): Promise<string> {
  const { id } = await api.post<{ id: string }>('/admins', input);
  return id;
}

export async function updateAdmin(
  id: string,
  values: { full_name?: string; role?: AdminRole; is_active?: boolean }
): Promise<void> {
  await api.patch(`/admins/${id}`, values);
}

export async function resetAdminPassword(id: string, newPassword: string): Promise<void> {
  await api.post(`/admins/${id}/reset-password`, { newPassword });
}

export async function deleteAdmin(id: string): Promise<void> {
  await api.delete(`/admins/${id}`);
}
