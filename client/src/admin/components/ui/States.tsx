import React from 'react';
import { Inbox, Loader2, AlertCircle, LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
        <Icon size={26} className="text-neutral-400" />
      </div>
      <p className="text-sm font-semibold text-neutral-700">{title}</p>
      {message && <p className="text-sm text-neutral-400 mt-1 max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Loader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
      <Loader2 size={28} className="animate-spin" />
      {label && <p className="text-sm mt-3">{label}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
        <AlertCircle size={26} className="text-rose-500" />
      </div>
      <p className="text-sm font-semibold text-neutral-700">Something went wrong</p>
      <p className="text-sm text-neutral-400 mt-1 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-neutral-50">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-5 py-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-4 bg-neutral-100 rounded animate-pulse"
              style={{ width: c === 0 ? '30%' : `${15 + ((r + c) % 3) * 5}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
