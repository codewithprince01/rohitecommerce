import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
}

export default function Pagination({ page, pageCount, total, pageSize, onPage }: PaginationProps) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Compact page window around the current page.
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pageCount, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-100 flex-wrap gap-3">
      <p className="text-xs text-neutral-500">
        Showing <span className="font-semibold text-neutral-700">{from}</span>–
        <span className="font-semibold text-neutral-700">{to}</span> of{' '}
        <span className="font-semibold text-neutral-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {start > 1 && (
          <>
            <PageBtn n={1} active={page === 1} onClick={onPage} />
            {start > 2 && <span className="px-1 text-neutral-400">…</span>}
          </>
        )}
        {pages.map((n) => (
          <PageBtn key={n} n={n} active={n === page} onClick={onPage} />
        ))}
        {end < pageCount && (
          <>
            {end < pageCount - 1 && <span className="px-1 text-neutral-400">…</span>}
            <PageBtn n={pageCount} active={page === pageCount} onClick={onPage} />
          </>
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function PageBtn({ n, active, onClick }: { n: number; active: boolean; onClick: (n: number) => void }) {
  return (
    <button
      onClick={() => onClick(n)}
      className={`min-w-8 h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:bg-neutral-100'
      }`}
    >
      {n}
    </button>
  );
}
