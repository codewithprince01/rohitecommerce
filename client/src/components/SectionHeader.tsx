import React, { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  badge?: ReactNode;
}

export default function SectionHeader({ title, subtitle, onSeeAll, badge }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-neutral-800">{title}</h2>
          {badge}
        </div>
        {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          className="flex items-center gap-0.5 text-primary-600 text-sm font-semibold"
        >
          See all
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}
