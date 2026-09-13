import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

// Pass a color class set (e.g. 'bg-primary-100 text-primary-700').
export default function Badge({ children, className = 'bg-neutral-100 text-neutral-700' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}
