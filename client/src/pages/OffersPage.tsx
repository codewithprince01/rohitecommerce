import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Copy,
  Check,
  Zap,
  Percent,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAllProducts, getFeaturedProducts } from '../lib/data';
import type { ProductWithVariants } from '../lib/supabase';
import ZeptoProductCard from '../components/ZeptoProductCard';

interface Coupon {
  code: string;
  title: string;
  discount: string;
  minOrder: string;
  validTill: string;
  category: string;
}

const coupons: Coupon[] = [
  {
    code: 'WELCOME100',
    title: 'First Order Special',
    discount: 'Flat ₹100 OFF',
    minOrder: 'Min ₹399',
    validTill: 'Valid on 1st order',
    category: 'All Items',
  },
  {
    code: 'FRESH50',
    title: 'Grocery Bonanza',
    discount: 'Flat ₹50 OFF',
    minOrder: 'Min ₹299',
    validTill: 'Expires in 2 days',
    category: 'Groceries',
  },
  {
    code: 'VEGGIE20',
    title: 'Farm Fresh Organic',
    discount: '20% OFF',
    minOrder: 'Min ₹199',
    validTill: 'Valid this week',
    category: 'Fruits & Veg',
  },
  {
    code: 'FREEFLY',
    title: 'Zero Delivery Fee',
    discount: 'FREE Delivery',
    minOrder: 'No min order',
    validTill: 'Daily 10am - 8pm',
    category: 'Express',
  },
  {
    code: 'SUPER300',
    title: 'Mega Kitchen Stockup',
    discount: 'Flat ₹300 OFF',
    minOrder: 'Min ₹1,499',
    validTill: 'Month end',
    category: 'Bulk Cart',
  },
];


const filterCategories = [
  'All Offers',
  'Groceries',
  'Snacks & Drinks',
  'Dairy & Bakery',
  'Personal Care',
];

export default function OffersPage() {
  const { navigate } = useApp();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
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

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

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
          2. COMPACT COUPONS ROW (Horizontal scroll / tight grid)
      ───────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <div className="flex items-center gap-1.5">
            <Tag size={16} className="text-primary-600" />
            <h2 className="text-xs sm:text-sm font-bold text-neutral-900">
              Active Promo Codes
            </h2>
          </div>
          <span className="text-[11px] text-neutral-500 font-medium">
            Tap code to copy & apply at checkout
          </span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none snap-x">
          {coupons.map((coupon) => {
            const isCopied = copiedCode === coupon.code;
            return (
              <div
                key={coupon.code}
                className="flex-shrink-0 w-[200px] sm:w-[220px] bg-white rounded-xl p-2.5 border border-neutral-200/80 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between snap-start"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary-50 text-primary-700">
                      {coupon.category}
                    </span>
                    <span className="text-[9.5px] text-neutral-400 font-medium">
                      {coupon.minOrder}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-neutral-900 leading-tight">
                    {coupon.discount}
                  </h3>
                  <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">
                    {coupon.title}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-dashed border-neutral-200 flex items-center justify-between gap-1.5">
                  <span className="font-mono text-xs font-black text-neutral-800 tracking-wider">
                    {coupon.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(coupon.code)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-primary-500 hover:bg-primary-600 text-white active:scale-95'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check size={11} className="stroke-[3]" />
                        <span>COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>COPY</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
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
