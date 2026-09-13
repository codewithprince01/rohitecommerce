/**
 * Activity (audit-trail) service — talks to the Express/MongoDB backend via
 * `api.ts`. No Supabase, no mock data: the immutable admin audit log is read
 * straight from the live database. This was the last service on the Supabase
 * mock; `base.ts`/`audit.ts` are no longer referenced here.
 */
import { api, apiList } from '../api';
import type { ListParams, Paginated, ActivityLog } from '../types';

export interface ActivityStats {
  total: number;
  today: number;
  last7: number;
  activeAdmins: number;
  byAction: { action: string; count: number }[];
  byEntity: { entity_type: string; count: number }[];
  topAdmins: { admin_email: string; count: number }[];
}

export interface ActivityFilterOptions {
  actions: string[];
  entities: string[];
  admins: string[];
}

export function listActivity(params: ListParams): Promise<Paginated<ActivityLog>> {
  return apiList<ActivityLog>('/activity', params);
}

export function getActivityStats(): Promise<ActivityStats> {
  return api.get<ActivityStats>('/activity/stats');
}

export function getActivityFilters(): Promise<ActivityFilterOptions> {
  return api.get<ActivityFilterOptions>('/activity/filters');
}

/**
 * Pages through every matching audit entry and returns a CSV string — real
 * records only, assembled from the live API.
 */
export async function exportActivityCsv(params: ListParams): Promise<string> {
  const pageSize = 100;
  let page = 1;
  const all: ActivityLog[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { rows, total } = await apiList<ActivityLog>('/activity', { ...params, page, pageSize });
    all.push(...rows);
    if (all.length >= total || rows.length === 0) break;
    page += 1;
  }

  const header = ['When', 'Admin', 'Action', 'Entity', 'Entity ID', 'Details'];
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = all.map((l) =>
    [
      l.created_at ? new Date(l.created_at).toISOString() : '',
      l.admin_email ?? 'system',
      l.action,
      l.entity_type ?? '',
      l.entity_id ?? '',
      l.metadata ? JSON.stringify(l.metadata) : '',
    ]
      .map(escape)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
}
