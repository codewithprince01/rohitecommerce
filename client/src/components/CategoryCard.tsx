import React from 'react';
import { ImageOff } from 'lucide-react';
import type { Category } from '../lib/supabase';
import { useApp } from '../context/AppContext';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const { setCategory } = useApp();

  return (
    <button
      onClick={() => setCategory(category.slug)}
      className="flex flex-col items-center gap-2 flex-shrink-0 w-20 lg:w-24 group"
    >
      <div
        className={`w-20 h-20 lg:w-24 lg:h-24 rounded-2xl overflow-hidden ${category.bg_color || 'bg-neutral-100'} border border-white shadow-card hover:shadow-card-hover relative group-active:scale-95 transition-all`}
      >
        {category.image ? (
          <img
            src={category.image}
            alt={category.name}
            className="w-full h-full object-cover mix-blend-multiply opacity-90"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={20} className="text-neutral-300" />
          </div>
        )}
      </div>
      <span className="text-xs lg:text-sm font-medium text-neutral-700 text-center leading-tight">
        {category.name}
      </span>
    </button>
  );
}
