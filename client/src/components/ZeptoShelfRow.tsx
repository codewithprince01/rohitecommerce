import React, { useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import ZeptoProductCard from './ZeptoProductCard';
import type { ZeptoProductItem } from '../data/homeZeptoData';

interface ZeptoShelfRowProps {
  title: string;
  products: ZeptoProductItem[];
  onSeeAll?: () => void;
}

export default function ZeptoShelfRow({ title, products, onSeeAll }: ZeptoShelfRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-6 lg:mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-neutral-900 tracking-tight">
          {title}
        </h2>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-xs sm:text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-0.5 transition-colors"
          >
            <span>See All</span>
            <ChevronRight size={14} className="stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Horizontal Carousel */}
      <div className="relative group/shelf">
        <div
          ref={scrollRef}
          className="flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide py-1 px-1 scroll-smooth"
        >
          {products.map(item => (
            <ZeptoProductCard key={item.id} item={item} />
          ))}
        </div>

        {/* Floating circular black scroll button on the right */}
        {products.length > 3 && (
          <button
            type="button"
            onClick={scrollRight}
            aria-label="Scroll right"
            className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/90 hover:bg-black text-white items-center justify-center shadow-xl z-20 hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/shelf:opacity-100"
          >
            <ChevronRight size={18} className="stroke-[2.5]" />
          </button>
        )}
      </div>
    </div>
  );
}
