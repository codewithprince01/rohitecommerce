import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { TableSkeleton, EmptyState, ErrorState } from './States';
import Pagination from './Pagination';
import type { UseTableResult } from '../../hooks/useTable';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T extends { id: string }> {
  table: UseTableResult<T>;
  columns: Column<T>[];
  selectable?: boolean;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
}

export default function DataTable<T extends { id: string }>({
  table,
  columns,
  selectable = false,
  onRowClick,
  emptyTitle = 'No records found',
  emptyMessage = 'Try adjusting your search or filters.',
  emptyAction,
}: DataTableProps<T>) {
  const { rows, loading, error, selected } = table;
  const allSelected = rows.length > 0 && selected.size === rows.length;

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/50">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={table.toggleSelectAll}
                    className="rounded border-neutral-300 text-primary-500 focus:ring-primary-400"
                    aria-label="Select all"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide ${col.className ?? ''}`}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => table.setSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-neutral-700"
                    >
                      {col.header}
                      {table.sortBy === col.key ? (
                        table.sortDir === 'asc' ? (
                          <ChevronUp size={13} />
                        ) : (
                          <ChevronDown size={13} />
                        )
                      ) : (
                        <ChevronsUpDown size={13} className="opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          {!loading && !error && rows.length > 0 && (
            <tbody className="divide-y divide-neutral-50">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={`${onRowClick ? 'cursor-pointer' : ''} hover:bg-neutral-50/60 transition-colors ${
                    selected.has(row.id) ? 'bg-primary-50/40' : ''
                  }`}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => table.toggleSelect(row.id)}
                        className="rounded border-neutral-300 text-primary-500 focus:ring-primary-400"
                        aria-label="Select row"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-sm text-neutral-700 ${col.className ?? ''}`}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {loading && <TableSkeleton cols={columns.length + (selectable ? 1 : 0)} />}
      {!loading && error && <ErrorState message={error} onRetry={table.refresh} />}
      {!loading && !error && rows.length === 0 && (
        <EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} />
      )}

      <Pagination
        page={table.page}
        pageCount={table.pageCount}
        total={table.total}
        pageSize={table.pageSize}
        onPage={table.setPage}
      />
    </div>
  );
}
