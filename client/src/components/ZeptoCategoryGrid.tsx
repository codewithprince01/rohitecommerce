import React from 'react';
import { ChevronRight, ImageOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Category } from '../lib/supabase';

interface ZeptoCategoryGridProps {
  /** Live categories from the API — the admin decides what appears here. */
  categories: Category[];
}

export default function ZeptoCategoryGrid({ categories }: ZeptoCategoryGridProps) {
  const { setCategory, navigate } = useApp();

  if (categories.length === 0) return null;

  // Two rows of ten on desktop, matching the storefront layout.
  const row1 = categories.slice(0, 10);
  const row2 = categories.slice(10, 20);

function CategoryTile({ cat, onClick }: { cat: Category; onClick: () => void }) {
  const [imgErr, setImgErr] = React.useState(false);
  const showImg = Boolean(cat.image) && !imgErr;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center group text-center focus:outline-none flex-shrink-0 w-[calc((100%-24px)/3)] min-w-[calc((100%-24px)/3)] max-w-[calc((100%-24px)/3)] sm:w-[112px] sm:min-w-[112px] sm:max-w-none lg:w-full lg:min-w-0 lg:max-w-[108px] snap-start"
    >
      <div
        className={`w-full aspect-square rounded-2xl shadow-sm relative overflow-hidden group-hover:shadow-md group-hover:scale-105 group-active:scale-95 transition-all duration-200 flex-shrink-0 ${
          cat.bg_color || 'bg-neutral-100'
        }`}
      >
        {showImg ? (
          <img
            src={cat.image!}
            alt={cat.name}
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover rounded-2xl aspect-square transition-transform group-hover:scale-105 duration-200"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-100/70 to-emerald-50 text-emerald-800 font-black text-xl select-none">
            <span>{cat.name.slice(0, 1).toUpperCase()}</span>
          </div>
        )}
      </div>

      <span className="text-[11px] sm:text-xs font-semibold text-neutral-800 text-center leading-tight line-clamp-2 mt-1.5 w-full min-h-[28px] group-hover:text-primary-600 transition-colors px-0.5">
        {cat.name}
      </span>
    </button>
  );
}

  return (
    <div className="mb-6 lg:mb-8">
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

      {/* Desktop: 10-column grid */}
      <div className="hidden lg:grid grid-cols-10 gap-x-2.5 gap-y-4 items-start justify-items-center">
        {categories.slice(0, 20).map((cat) => (
          <CategoryTile key={cat.id} cat={cat} onClick={() => setCategory(cat.slug)} />
        ))}
      </div>

      {/* Mobile/tablet: two scrollable rows */}
      <div className="lg:hidden flex flex-col gap-3">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide py-1 px-0.5 snap-x snap-mandatory scroll-smooth">
          {row1.map((cat) => (
            <CategoryTile key={cat.id} cat={cat} onClick={() => setCategory(cat.slug)} />
          ))}
        </div>
        {row2.length > 0 && (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide py-1 px-0.5 snap-x snap-mandatory scroll-smooth">
            {row2.map((cat) => (
              <CategoryTile key={cat.id} cat={cat} onClick={() => setCategory(cat.slug)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
