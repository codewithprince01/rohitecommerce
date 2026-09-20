import React, { useState, useEffect } from 'react';
import { ChevronRight, Store } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCategories, getFeaturedProducts, getPublicHomeSections, type PublicHomeSection } from '../lib/data';
import type { Category, ProductWithVariants } from '../lib/supabase';
import ZeptoCategoryGrid from '../components/ZeptoCategoryGrid';
import ZeptoShelfRow from '../components/ZeptoShelfRow';
import ZeptoProductCard from '../components/ZeptoProductCard';

export default function HomePage() {
  const { navigate, setCategory } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithVariants[]>([]);
  const [homeSections, setHomeSections] = useState<PublicHomeSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [catData, prodData, sectionsData] = await Promise.all([
          getCategories(),
          getFeaturedProducts(),
          getPublicHomeSections(),
        ]);
        setCategories(catData);
        setFeaturedProducts(prodData);
        setHomeSections(sectionsData);
      } catch (err) {
        console.error('Failed to fetch home data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-8 lg:pb-12 max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-3">
      {/* 2-Row Shop by Category Grid */}
      <ZeptoCategoryGrid categories={categories} />

      {/* Shelves exactly as configured in Admin → Home Sections */}
      {homeSections.map((section) => (
        <ZeptoShelfRow
          key={section.id}
          title={section.title}
          subtitle={section.subtitle}
          badge={section.badge}
          productObjects={section.products}
          onSeeAll={() => {
            if (section.category?.slug) {
              setCategory(section.category.slug);
            }
            navigate('categories');
          }}
        />
      ))}

      {/* Additional Featured items from database */}
      {featuredProducts.length > 0 && (
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-neutral-900 tracking-tight">
              More For You
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
          <div className="flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide py-1 px-1 scroll-smooth">
            {featuredProducts.slice(0, 10).map((p) => (
              <ZeptoProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Nothing published yet — say so plainly instead of faking a catalog. */}
      {categories.length === 0 && homeSections.length === 0 && featuredProducts.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <Store size={26} className="text-neutral-400" />
          </div>
          <h2 className="text-base font-bold text-neutral-800">The store is being set up</h2>
          <p className="text-sm text-neutral-500 mt-1 max-w-sm mx-auto">
            Products and categories will appear here as soon as they are added. Please check back shortly.
          </p>
        </div>
      )}
    </div>
  );
}

