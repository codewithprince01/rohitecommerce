import React, { useEffect, useState } from 'react';
import { ImageOff, LayoutGrid } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCategories, getAllSubcategories } from '../lib/data';
import type { Category, Subcategory } from '../lib/supabase';

/**
 * Every category the admin has published, grouped by its parent category with
 * that category's subcategories underneath. Nothing here is hardcoded — the
 * groups appear, disappear and reorder as the catalog changes.
 */
export default function CategoriesPage() {
  const { setCategory } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [cats, subs] = await Promise.all([getCategories(), getAllSubcategories()]);
      if (!active) return;
      setCategories(cats);
      setSubcategories(subs);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
          <LayoutGrid size={26} className="text-neutral-400" />
        </div>
        <h2 className="text-base font-bold text-neutral-800">No categories yet</h2>
        <p className="text-sm text-neutral-500 mt-1">
          The store is being set up. Please check back shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="space-y-10">
        {categories.map((category) => {
          const children = subcategories.filter((s) => s.category_id === category.id);
          // A category with no subcategories still gets a tile of its own, so
          // it is reachable the moment the admin creates it.
          const tiles = children.length
            ? children.map((s) => ({ id: s.id, name: s.name, slug: s.slug, image: s.image }))
            : [{ id: category.id, name: category.name, slug: category.slug, image: category.image }];

          return (
            <div key={category.id} className="space-y-4">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-neutral-900 tracking-tight">
                {category.name}
              </h2>

              <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-5 items-start">
                {tiles.map((tile) => (
                  <button
                    key={tile.id}
                    type="button"
                    onClick={() => setCategory(tile.slug)}
                    className="w-[106px] sm:w-[120px] md:w-[130px] lg:w-[136px] flex flex-col items-center group text-center focus:outline-none cursor-pointer flex-shrink-0"
                  >
                    <div className="w-full aspect-square h-[106px] sm:h-[120px] md:h-[130px] lg:h-[136px] rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-105 group-active:scale-95 transition-all duration-200 relative bg-neutral-100">
                      {tile.image ? (
                        <img
                          src={tile.image}
                          alt={tile.name}
                          className="w-full h-full object-cover rounded-2xl transition-transform duration-200 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff size={22} className="text-neutral-300" />
                        </div>
                      )}
                    </div>

                    <span className="text-xs sm:text-[13px] font-bold text-neutral-800 text-center leading-snug line-clamp-2 mt-2 w-full min-h-[34px] group-hover:text-primary-600 transition-colors">
                      {tile.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
