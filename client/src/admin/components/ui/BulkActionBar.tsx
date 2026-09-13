import React from 'react';
import { X } from 'lucide-react';

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  children: React.ReactNode;
}

// Floating action bar shown when one or more rows are selected.
export default function BulkActionBar({ count, onClear, children }: BulkActionBarProps) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-[calc(50%+8rem)] z-50">
      <div className="flex items-center gap-3 bg-neutral-800 text-white rounded-2xl shadow-card-hover px-4 py-3">
        <button onClick={onClear} className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center">
          <X size={15} />
        </button>
        <span className="text-sm font-medium">{count} selected</span>
        <div className="w-px h-5 bg-white/20" />
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </div>
  );
}
