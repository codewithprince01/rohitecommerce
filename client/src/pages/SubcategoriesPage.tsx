import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Package, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSubcategoriesByCategory, getCategoryBySlug } from '../lib/data';
import type { Subcategory, Category } from '../lib/supabase';

export default function SubcategoriesPage() {
  const { state, navigate, setSubcategory } = useApp();
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [ category, setCategory ] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!state.selectedCategorySlug) return;

      setLoading(true);
      try {
        const [catData, subData] = await Promise.all([
          getCategoryBySlug(state.selectedCategorySlug!),
          getSubcategoriesByCategory(state.selectedCategorySlug!),
        ]);

        setCategory(catData);
        setSubcategories(subData);
      } catch (err) {
        console.error('Failed to fetch subcategories:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [state.selectedCategorySlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-4 lg:pb-8">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-[104px] z-40 bg-white px-4 py-3 flex items-center gap-3 border-b border-neutral-100 shadow-sm">
        <button
          onClick={() => navigate('categories')}
          className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={18} className="text-neutral-700" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-neutral-800">{category?.name || 'Categories'}</h2>
          <p className="text-xs text-neutral-500">{subcategories.length} subcategories</p>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
          <button onClick={() => navigate('home')} className="hover:text-primary-600 font-medium">Home</button>
          <ArrowRight size={12} />
          <button onClick={() => navigate('categories')} className="hover:text-primary-600 font-medium">Categories</button>
          <ArrowRight size={12} />
          <span className="text-neutral-800 font-bold">{category?.name}</span>
        </div>
        <h2 className="text-2xl font-bold text-neutral-800">{category?.name}</h2>
        <p className="text-sm text-neutral-500 mt-1">{subcategories.length} subcategories available</p>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-6 mt-3 lg:mt-6">
        <div className="max-w-7xl mx-auto">
          {subcategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center">
                <Package size={32} className="text-neutral-300" />
              </div>
              <p className="text-neutral-500 text-sm font-medium">No subcategories available</p>
            </div>
          ) : (
            <>
              {/* Desktop Grid */}
              <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {subcategories.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setSubcategory(sub.slug)}
                    className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover transition-all group"
                  >
                    <div className={`h-36 relative overflow-hidden`}>
                      <img
                        src={sub.image || 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400'}
                        alt={sub.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4 text-left">
                      <p className="text-base font-bold text-neutral-800">{sub.name}</p>
                      <div className="flex items-center gap-1 text-sm text-primary-600 mt-1 font-medium">
                        View Brands <ChevronRight size={14} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Mobile Grid */}
              <div className="lg:hidden grid grid-cols-2 gap-3">
                {subcategories.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setSubcategory(sub.slug)}
                    className="bg-white rounded-2xl shadow-card overflow-hidden active:scale-95 transition-transform"
                  >
                    <div className="h-24 relative overflow-hidden">
                      <img
                        src={sub.image || 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400'}
                        alt={sub.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-bold text-neutral-800">{sub.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
