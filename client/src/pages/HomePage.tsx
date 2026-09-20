import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getCategories, getFeaturedProducts } from '../lib/data';
import type { Category, ProductWithVariants } from '../lib/supabase';
import ZeptoHeroBanners from '../components/ZeptoHeroBanners';
import ZeptoCategoryGrid from '../components/ZeptoCategoryGrid';
import ZeptoShelfRow from '../components/ZeptoShelfRow';
import ProductCard from '../components/ProductCard';
import SectionHeader from '../components/SectionHeader';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [catData, prodData] = await Promise.all([
          getCategories(),
          getFeaturedProducts(),
        ]);
        setCategories(catData);
        setFeaturedProducts(prodData);
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
      {/* Top Dual Hero Banners: Zepto Experience + Paan Corner */}
      <ZeptoHeroBanners />

      {/* 2-Row Shop by Category Grid */}
      <ZeptoCategoryGrid />

      {/* Shelf 1: Laundry Care */}
      <ZeptoShelfRow
        title="Laundry Care"
        products={laundryProducts}
        onSeeAll={() => {
          setCategory('personal-care');
          navigate('categories');
        }}
      />

      {/* Shelf 2: Cleaning Essentials */}
      <ZeptoShelfRow
        title="Cleaning Essentials"
        products={cleaningProducts}
        onSeeAll={() => {
          setCategory('personal-care');
          navigate('categories');
        }}
      />

      {/* Shelf 3: Rice */}
      <ZeptoShelfRow
        title="Rice"
        products={riceProducts}
        onSeeAll={() => {
          setCategory('staples');
          navigate('categories');
        }}
      />

      {/* Shelf 4: Hair care */}
      <ZeptoShelfRow
        title="Hair care"
        products={hairCareProducts}
        onSeeAll={() => {
          setCategory('personal-care');
          navigate('categories');
        }}
      />

      {/* Additional Featured items from database */}
      {featuredProducts.length > 0 && (
        <div className="mt-8 pt-4 border-t border-neutral-100">
          <SectionHeader
            title="More For You"
            subtitle="Trending in your area"
            onSeeAll={() => navigate('categories')}
          />
          <div className="flex gap-3 overflow-x-auto scrollbar-hide py-1">
            {featuredProducts.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
