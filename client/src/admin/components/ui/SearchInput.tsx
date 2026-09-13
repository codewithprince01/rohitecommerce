import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
}: SearchInputProps) {
  return (
    <div
      className={`flex items-center gap-2.5 bg-white border border-neutral-200 rounded-xl px-3.5 py-2.5 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-colors ${className}`}
    >
      <Search size={16} className="text-neutral-400 flex-shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-neutral-700 placeholder-neutral-400 outline-none min-w-0"
      />
      {value && (
        <button onClick={() => onChange('')} aria-label="Clear search">
          <X size={15} className="text-neutral-400 hover:text-neutral-600" />
        </button>
      )}
    </div>
  );
}
