import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Percent,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAllProducts, getFeaturedProducts } from '../lib/data';
import type { ProductWithVariants } from '../lib/supabase';
import ZeptoProductCard from '../components/ZeptoProductCard';

const filterCategories = [
  'All Offers',
  'Groceries',
  'Snacks & Drinks',
  'Dairy & Bakery',
  'Personal Care',
];

export default function OffersPage() {
  const { navigate } = useApp();
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('All Offers');

  useEffect(() => {
    async function loadDeals() {
      try {
        // Fetch all products to get maximum offers
        const all = await getAllProducts();
        if (all && all.length > 0) {
          setProducts(all);
        } else {
          const featured = await getFeaturedProducts();
          setProducts(featured);
        }
      } catch (e) {
        console.error('Failed to load deals', e);
        try {
          const featured = await getFeaturedProducts();
          setProducts(featured);
        } catch {}
      } finally {
        setLoading(false);
      }
    }
    loadDeals();
  }, []);

  // Filter products by category or show all offer products
  const offerProducts = useMemo(() => {
    // Sort items so items with biggest discounts come first
    const sorted = [...products].sort((a, b) => {
      const aDisc = a.variants?.[0]?.discount || 
        ((a.variants?.[0]?.original_price || 0) - (a.variants?.[0]?.price || 0));
      const bDisc = b.variants?.[0]?.discount || 
        ((b.variants?.[0]?.original_price || 0) - (b.variants?.[0]?.price || 0));
      return bDisc - aDisc;
    });

    if (selectedFilter === 'All Offers') return sorted;
    const filterLower = selectedFilter.toLowerCase();

    return sorted.filter((p) => {
      const name = p.name.toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const tags = (p.tags || []).map((t) => t.toLowerCase()).join(' ');

      if (filterLower.includes('grocer')) {
        return (
          tags.includes('veg') ||
          tags.includes('fruit') ||
          tags.includes('staple') ||
          name.includes('atta') ||
          name.includes('rice') ||
          name.includes('oil') ||
          name.includes('dal')
        );
      }
      if (filterLower.includes('snack')) {
        return (
          tags.includes('snack') ||
          tags.includes('beverage') ||
          name.includes('chip') ||
          name.includes('juice') ||
          name.includes('coke') ||
          name.includes('tea') ||
          name.includes('coffee')
        );
      }
      if (filterLower.includes('dairy')) {
        return (
          tags.includes('dairy') ||
          tags.includes('bakery') ||
          name.includes('milk') ||
          name.includes('bread') ||
          name.includes('butter') ||
          name.includes('paneer')
        );
      }
      if (filterLower.includes('personal')) {
        return (
          tags.includes('personal') ||
          tags.includes('care') ||
          name.includes('shampoo') ||
          name.includes('soap') ||
          name.includes('cream')
        );
      }
      return true;
    });
  }, [products, selectedFilter]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. COMPACT HERO STRIP (Clean & Not oversized)
      ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F766E] via-[#059669] to-[#047857] text-white px-4 py-3.5 sm:px-6 sm:py-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
            <Zap size={22} className="text-amber-300 fill-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-none">
                Mega Deals & Offers Corner
              </h1>
              <span className="bg-amber-400 text-neutral-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Active
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-100 mt-1 font-medium">
              Save big on daily essentials with handpicked flash deals & coupons
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => navigate('categories')}
            className="px-3 py-1.5 bg-white text-emerald-800 text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-50 active:scale-95 transition-all"
          >
            All Categories
          </button>
          <button
            type="button"
            onClick={() => navigate('cart')}
            className="px-3 py-1.5 bg-black/20 hover:bg-black/30 text-white text-xs font-bold rounded-xl border border-white/20 active:scale-95 transition-all"
          >
            View Cart
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. CATEGORY FILTER PILLS (Clean & compact)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filterCategories.map((cat) => {
          const isSelected = selectedFilter === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedFilter(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300 hover:text-neutral-900'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. ALL OFFER PRODUCTS GRID (Using ZeptoProductCard)
      ───────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <div className="flex items-center gap-1.5">
            <Percent size={16} className="text-primary-600" />
            <h2 className="text-sm sm:text-base font-black text-neutral-900">
              Today's Offer Products ({offerProducts.length})
            </h2>
          </div>
          <span className="text-[11px] text-neutral-500 font-medium">
            Best prices guaranteed
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : offerProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200/80 p-6">
            <p className="text-neutral-500 text-sm font-medium">
              No products found in this offer category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
            {offerProducts.map((product) => (
              <ZeptoProductCard
                key={product.id}
                product={product}
                className="w-full"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
