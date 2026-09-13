import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconClass?: string;
  trend?: { value: string; positive: boolean } | null;
  loading?: boolean;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  iconClass = 'bg-primary-50 text-primary-600',
  trend,
  loading,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconClass}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <span
            className={`text-xs font-semibold ${trend.positive ? 'text-primary-600' : 'text-rose-500'}`}
          >
            {trend.value}
          </span>
        )}
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="h-7 w-20 bg-neutral-100 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-neutral-800">{value}</p>
        )}
        <p className="text-sm text-neutral-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
