import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCategories, getFeaturedProducts, getPublicHomeSections, type PublicHomeSection } from '../lib/data';
import type { Category, ProductWithVariants } from '../lib/supabase';
import ZeptoCategoryGrid from '../components/ZeptoCategoryGrid';
import ZeptoShelfRow from '../components/ZeptoShelfRow';
import ZeptoProductCard from '../components/ZeptoProductCard';
import {
  laundryProducts,
  cleaningProducts,
  riceProducts,
  hairCareProducts,
} from '../data/homeZeptoData';

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
      <ZeptoCategoryGrid />

      {/* Dynamic Database-Driven Home Shelves (Created & Managed in Admin Panel) */}
      {homeSections.length > 0 ? (
        homeSections.map((section) => (
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
        ))
      ) : (
        /* Fallback shelves if no custom sections configured yet */
        <>
          <ZeptoShelfRow
            title="Laundry Care"
            products={laundryProducts}
            onSeeAll={() => {
              setCategory('personal-care');
              navigate('categories');
            }}
          />
          <ZeptoShelfRow
            title="Cleaning Essentials"
            products={cleaningProducts}
            onSeeAll={() => {
              setCategory('personal-care');
              navigate('categories');
            }}
          />
          <ZeptoShelfRow
            title="Rice"
            products={riceProducts}
            onSeeAll={() => {
              setCategory('staples');
              navigate('categories');
            }}
          />
          <ZeptoShelfRow
            title="Hair care"
            products={hairCareProducts}
            onSeeAll={() => {
              setCategory('personal-care');
              navigate('categories');
            }}
          />
        </>
      )}

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
    </div>
  );
}

