import { useState, useEffect, useCallback, useRef } from 'react';
import type { ListParams, Paginated } from '../lib/types';

interface UseTableOptions {
  pageSize?: number;
  initialSortBy?: string;
  initialSortDir?: 'asc' | 'desc';
  initialFilters?: Record<string, string | number | boolean | null | undefined>;
}

export interface UseTableResult<T> {
  rows: T[];
  total: number;
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  pageCount: number;
  search: string;
  sortBy?: string;
  sortDir: 'asc' | 'desc';
  filters: Record<string, string | number | boolean | null | undefined>;
  selected: Set<string>;
  setPage: (p: number) => void;
  setSearch: (s: string) => void;
  setSort: (column: string) => void;
  setFilter: (key: string, value: string | number | boolean | null | undefined) => void;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  refresh: () => void;
}

// Reusable list-state engine: pagination, debounced search, sort, filters,
// row selection. Pages just supply a fetcher and render.
export function useTable<T extends { id: string }>(
  fetcher: (params: ListParams) => Promise<Paginated<T>>,
  options: UseTableOptions = {}
): UseTableResult<T> {
  const { pageSize = 10, initialSortBy, initialSortDir = 'desc', initialFilters = {} } = options;

  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearchRaw] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<string | undefined>(initialSortBy);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialSortDir);
  const [filters, setFilters] = useState(initialFilters);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reloadKey, setReloadKey] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Debounce search input.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 whenever query inputs change.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortBy, sortDir, JSON.stringify(filters)]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetcherRef
      .current({ page, pageSize, search: debouncedSearch, sortBy, sortDir, filters })
      .then((res) => {
        if (!active) return;
        setRows(res.rows);
        setTotal(res.total);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message ?? 'Failed to load data');
        setRows([]);
        setTotal(0);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, pageSize, debouncedSearch, sortBy, sortDir, JSON.stringify(filters), reloadKey]);

  const setSort = useCallback((column: string) => {
    setSortBy((prev) => {
      if (prev === column) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return column;
    });
  }, []);

  const setFilter = useCallback(
    (key: string, value: string | number | boolean | null | undefined) => {
      setFilters((f) => ({ ...f, [key]: value }));
    },
    []
  );

  const toggleSelect = useCallback((id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelected((s) => {
      if (s.size === rows.length) return new Set();
      return new Set(rows.map((r) => r.id));
    });
  }, [rows]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);
  const refresh = useCallback(() => {
    clearSelection();
    setReloadKey((k) => k + 1);
  }, [clearSelection]);

  return {
    rows,
    total,
    loading,
    error,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    search,
    sortBy,
    sortDir,
    filters,
    selected,
    setPage,
    setSearch: setSearchRaw,
    setSort,
    setFilter,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    refresh,
  };
}
