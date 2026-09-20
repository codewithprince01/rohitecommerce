import React from 'react';
import { useApp } from '../context/AppContext';
import { categoryGroupsData, type GroupedCategoryItem } from '../data/categoriesGroupedData';

export default function CategoriesPage() {
  const { setCategory } = useApp();

  const handleCategoryClick = (item: GroupedCategoryItem) => {
    setCategory(item.slug);
  };

  return (
    <div className="pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Category Groups Matching Screenshot */}
      <div className="space-y-10">
        {categoryGroupsData.map((group) => (
          <div key={group.id} className="space-y-4">
            {/* Group Title */}
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-neutral-900 tracking-tight">
              {group.title}
            </h2>

            {/* Items Row - All cards uniform in size and design */}
            <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-5 items-start">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleCategoryClick(item)}
                  className="w-[106px] sm:w-[120px] md:w-[130px] lg:w-[136px] flex flex-col items-center group text-center focus:outline-none cursor-pointer flex-shrink-0"
                >
                  {/* Image Card Container - Identical square card for all categories */}
                  <div className="w-full aspect-square h-[106px] sm:h-[120px] md:h-[130px] lg:h-[136px] rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-105 group-active:scale-95 transition-all duration-200 relative bg-neutral-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-2xl transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop';
                      }}
                    />
                  </div>

                  {/* Label */}
                  <span className="text-xs sm:text-[13px] font-bold text-neutral-800 text-center leading-snug line-clamp-2 mt-2 w-full min-h-[34px] group-hover:text-primary-600 transition-colors">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
