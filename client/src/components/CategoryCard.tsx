import React from 'react';
import { Category } from '../data/products';
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
        <img
          src={category.image || 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400'}
          alt={category.name}
          className="w-full h-full object-cover mix-blend-multiply opacity-90"
          loading="lazy"
        />
      </div>
      <span className="text-xs lg:text-sm font-medium text-neutral-700 text-center leading-tight">
        {category.name}
      </span>
    </button>
  );
}
