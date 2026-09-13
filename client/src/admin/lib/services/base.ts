import { supabase } from '../../../lib/supabase';
import type { ListParams, Paginated } from '../types';

export interface ListConfig {
  table: string;
  select?: string;
  searchColumns?: string[];
  defaultSort?: { column: string; ascending: boolean };
}

// Generic server-side paginated/filtered/sorted list used by every module.
export async function listEntities<T>(
  config: ListConfig,
  params: ListParams = {}
): Promise<Paginated<T>> {
  const {
    page = 1,
    pageSize = 10,
    search = '',
    sortBy,
    sortDir,
    filters = {},
  } = params;

  let query = supabase
    .from(config.table)
    .select(config.select ?? '*', { count: 'exact' });

  // Free-text search across configured columns (OR of ilike).
  if (search.trim() && config.searchColumns?.length) {
    const term = search.trim().replace(/[%,()]/g, '');
    const orClause = config.searchColumns
      .map((col) => `${col}.ilike.%${term}%`)
      .join(',');
    query = query.or(orClause);
  }

  // Equality filters (skip empty/undefined so "All" options are no-ops).
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    query = query.eq(key, value);
  }

  // Sorting
  const sortColumn = sortBy ?? config.defaultSort?.column ?? 'created_at';
  const ascending = sortDir
    ? sortDir === 'asc'
    : config.defaultSort?.ascending ?? false;
  query = query.order(sortColumn, { ascending });

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return { rows: (data as T[]) ?? [], total: count ?? 0 };
}

export async function getById<T>(table: string, id: string, select = '*'): Promise<T | null> {
  const { data, error } = await supabase.from(table).select(select).eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as T) ?? null;
}

export async function insertOne<T>(table: string, values: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.from(table).insert(values).select().single();
  if (error) throw error;
  return data as T;
}

export async function updateOne<T>(
  table: string,
  id: string,
  values: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.from(table).update(values).eq('id', id).select().single();
  if (error) throw error;
  return data as T;
}

export async function removeOne(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

export async function removeMany(table: string, ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase.from(table).delete().in('id', ids);
  if (error) throw error;
}

export async function updateMany(
  table: string,
  ids: string[],
  values: Record<string, unknown>
): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase.from(table).update(values).in('id', ids);
  if (error) throw error;
}
