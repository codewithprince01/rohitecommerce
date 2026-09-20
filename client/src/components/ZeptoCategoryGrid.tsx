import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { zeptoCategories, type ZeptoCategory } from '../data/homeZeptoData';

interface ZeptoCategoryGridProps {
  categories?: ZeptoCategory[];
}

export default function ZeptoCategoryGrid({ categories = zeptoCategories }: ZeptoCategoryGridProps) {
  const { setCategory, navigate } = useApp();

  const handleCategoryClick = (cat: ZeptoCategory) => {
    setCategory(cat.slug);
  };

  const row1 = categories.slice(0, 10);
  const row2 = categories.slice(10, 20);

  const renderCategoryItem = (cat: ZeptoCategory) => (
    <button
      key={cat.id}
      type="button"
      onClick={() => handleCategoryClick(cat)}
      className="flex flex-col items-center group text-center focus:outline-none flex-shrink-0 w-[82px] sm:w-[94px] lg:w-[104px] xl:w-[108px]"
    >
      {/* Image Container - Full bleed rounded image without border or padding */}
      <div className="w-[82px] h-[82px] sm:w-[94px] sm:h-[94px] lg:w-[104px] lg:h-[104px] xl:w-[108px] xl:h-[108px] aspect-square rounded-2xl shadow-sm relative overflow-hidden group-hover:shadow-md group-hover:scale-105 group-active:scale-95 transition-all duration-200 flex-shrink-0">
        {cat.isNew && (
          <span className="absolute top-1.5 left-1.5 bg-[#7C3AED] text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow z-10">
            NEW
          </span>
        )}
        <img
          src={cat.image}
          alt={cat.name}
          className="w-full h-full object-cover rounded-2xl aspect-square transition-transform group-hover:scale-105 duration-200"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop';
          }}
        />
      </div>

      {/* Label - Uniform height and alignment */}
      <span className="text-[10.5px] sm:text-xs font-semibold text-neutral-800 text-center leading-tight line-clamp-2 mt-1.5 w-full min-h-[28px] group-hover:text-primary-600 transition-colors">
        {cat.name}
      </span>
    </button>
  );

  return (
    <div className="mb-6 lg:mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-neutral-900 tracking-tight">
          Shop by Category
        </h2>
        <button
          type="button"
          onClick={() => navigate('categories')}
          className="text-xs sm:text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-0.5 transition-colors"
        >
          <span>See All</span>
          <ChevronRight size={14} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Desktop: Exact 10-column 2-row grid with uniform centered square items */}
      <div className="hidden lg:grid grid-cols-10 gap-x-2.5 gap-y-4 items-start justify-items-center">
        {categories.map(cat => renderCategoryItem(cat))}
      </div>

      {/* Mobile/Tablet: 2 smooth scroll rows */}
      <div className="lg:hidden flex flex-col gap-3">
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide py-1 px-1">
          {row1.map(cat => renderCategoryItem(cat))}
        </div>
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide py-1 px-1">
          {row2.map(cat => renderCategoryItem(cat))}
        </div>
      </div>
    </div>
  );
}
