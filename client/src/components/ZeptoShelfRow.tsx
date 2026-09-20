import React, { useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import ZeptoProductCard from './ZeptoProductCard';
import type { ZeptoProductItem } from '../data/homeZeptoData';
import type { ProductWithVariants } from '../lib/supabase';

interface ZeptoShelfRowProps {
  title: string;
  subtitle?: string;
  badge?: string;
  products?: ZeptoProductItem[];
  productObjects?: ProductWithVariants[];
  onSeeAll?: () => void;
}

export default function ZeptoShelfRow({
  title,
  subtitle,
  badge,
  products = [],
  productObjects = [],
  onSeeAll,
}: ZeptoShelfRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  const hasItems = products.length > 0 || productObjects.length > 0;
  if (!hasItems) return null;

  return (
    <div className="mb-6 lg:mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-neutral-900 tracking-tight">
              {title}
            </h2>
            {badge && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-xs sm:text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-0.5 transition-colors shrink-0"
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
          {productObjects.length > 0
            ? productObjects.map((prod) => (
                <ZeptoProductCard key={prod.id} product={prod} />
              ))
            : products.map((item) => (
                <ZeptoProductCard key={item.id} item={item} />
              ))}
        </div>

        {/* Floating circular black scroll button on the right */}
        {(productObjects.length > 3 || products.length > 3) && (
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

