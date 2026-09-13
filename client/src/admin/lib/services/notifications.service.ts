/**
 * Notifications service — talks to the Express/MongoDB backend via `api.ts`.
 * No Supabase, no mock data: the notification feed, unread badge and all
 * mutations hit the real `/notifications` API and the live database.
 */
import { api, apiList } from '../api';
import type { ListParams, Paginated, NotificationRow } from '../types';

export type NotificationType = NotificationRow['type'];

export interface NotificationStats {
  total: number;
  unread: number;
  today: number;
  byType: Record<NotificationType, number>;
  unreadByType: Record<NotificationType, number>;
}

/* ------------------------------ Queries ------------------------------- */

export function listNotifications(params: ListParams): Promise<Paginated<NotificationRow>> {
  return apiList<NotificationRow>('/notifications', params);
}

export function getNotificationStats(): Promise<NotificationStats> {
  return api.get<NotificationStats>('/notifications/stats');
}

export async function unreadCount(): Promise<number> {
  const { count } = await api.get<{ count: number }>('/notifications/unread-count');
  return count;
}

/* ----------------------------- Mutations ------------------------------ */

export async function markRead(id: string, isRead = true): Promise<void> {
  await api.patch(`/notifications/${id}/read`, { is_read: isRead });
}

export async function markAllRead(): Promise<void> {
  await api.post('/notifications/read-all');
}

export async function bulkNotifications(
  ids: string[],
  action: 'read' | 'unread' | 'delete'
): Promise<void> {
  await api.post('/notifications/bulk', { ids, action });
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}

export async function clearRead(): Promise<void> {
  await api.post('/notifications/clear-read');
}
