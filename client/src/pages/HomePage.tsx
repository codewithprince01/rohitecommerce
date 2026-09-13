import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, Leaf, Coffee, ShoppingBag, Star, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCategories, getFeaturedProducts } from '../lib/data';
import { getPublicBanners, type StoreBanner } from '../lib/banners';
import type { Category, ProductWithVariants } from '../lib/supabase';
import CategoryCard from '../components/CategoryCard';
import OfferBanner from '../components/OfferBanner';
import ProductCard from '../components/ProductCard';
import FlashSaleTimer from '../components/FlashSaleTimer';
import SectionHeader from '../components/SectionHeader';

export default function HomePage() {
  const { state, navigate, setCategory } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithVariants[]>([]);
  const [banners, setBanners] = useState<StoreBanner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [catData, prodData, bannerData] = await Promise.all([
          getCategories(),
          getFeaturedProducts(),
          getPublicBanners('home_hero'),
        ]);
        setCategories(catData);
        setFeaturedProducts(prodData);
        setBanners(bannerData);
      } catch (err) {
        console.error('Failed to fetch home data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Route a banner click to the right destination based on its configured link.
  const handleBannerClick = (b: StoreBanner) => {
    if (b.link_type === 'url' && b.link_value) {
      window.open(b.link_value, '_blank', 'noopener');
      return;
    }
    if (b.link_type === 'category' && b.link_value) {
      setCategory(b.link_value);
      return;
    }
    navigate('categories');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-4 lg:pb-8">
      {/* Offer Banner — real banners managed from the admin panel */}
      {banners.length > 0 && (
        <div className="px-4 lg:px-6 mb-6">
          <div className="max-w-7xl mx-auto">
            <OfferBanner offers={banners} onSelect={handleBannerClick} />
          </div>
        </div>
      )}

      {/* Quick Deal Chips */}
      <div className="px-4 lg:px-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 lg:gap-3">
            {[
              { label: 'Free Delivery', color: 'bg-primary-50 text-primary-700 border-primary-200' },
              { label: '10 Min Delivery', color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { label: 'Fresh Picks', color: 'bg-green-50 text-green-700 border-green-200' },
              { label: 'Best Sellers', color: 'bg-rose-50 text-rose-700 border-rose-200' },
              { label: 'Organic', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            ].map(chip => (
              <span
                key={chip.label}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border ${chip.color} cursor-pointer hover:scale-105 transition-transform`}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 lg:px-6 mb-6 lg:mb-8">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Shop by Category"
            onSeeAll={() => navigate('categories')}
          />
          <div className="flex gap-4 lg:gap-6 overflow-x-auto scrollbar-hide py-1 -mx-1 px-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.slug)}
                className="flex flex-col items-center gap-2 flex-shrink-0 w-20 lg:w-24 group"
              >
                <div
                  className={`w-20 h-20 lg:w-24 lg:h-24 rounded-2xl overflow-hidden ${(cat.bg_color || 'bg-neutral-100')} border border-white shadow-card hover:shadow-card-hover relative group-active:scale-95 transition-all`}
                >
                  <img
                    src={cat.image || 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=200'}
                    alt={cat.name}
                    className="w-full h-full object-cover mix-blend-multiply opacity-90"
                    loading="lazy"
                  />
                </div>
                <span className="text-xs lg:text-sm font-medium text-neutral-700 text-center leading-tight">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Flash Sale */}
      <div className="px-4 lg:px-6 mb-6 lg:mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-orange-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-accent-500 rounded-xl lg:rounded-2xl flex items-center justify-center">
                  <Zap size={18} className="text-white fill-white lg:w-6 lg:h-6" />
                </div>
                <div>
                  <h2 className="text-lg lg:text-xl font-bold text-neutral-800">Flash Sale</h2>
                  <p className="text-xs lg:text-sm text-neutral-500">Best deals, limited time</p>
                </div>
              </div>
              <div className="flex items-center gap-3 lg:gap-4">
                <FlashSaleTimer />
                <button
                  onClick={() => navigate('categories')}
                  className="hidden lg:flex items-center gap-1.5 text-sm font-semibold text-accent-600 hover:text-accent-700"
                >
                  View All <ArrowRight size={14} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 lg:gap-4 overflow-x-auto scrollbar-hide">
              {featuredProducts.filter(p => p.variants?.[0]?.discount >= 15).slice(0, 6).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="px-4 lg:px-6 mb-6 lg:mb-8">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Top Picks For You"
            subtitle="Highly rated by customers"
            badge={
              <span className="flex items-center gap-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                <Star size={9} className="fill-amber-500 text-amber-500" />
                Top Rated
              </span>
            }
            onSeeAll={() => navigate('categories')}
          />
          {/* Mobile: Horizontal scroll */}
          <div className="flex gap-3 lg:hidden overflow-x-auto scrollbar-hide">
            {featuredProducts.slice(0, 8).map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {/* Desktop: Grid */}
          <div className="hidden lg:grid grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {featuredProducts.slice(0, 12).map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>

      {/* Promo cards row */}
      <div className="px-4 lg:px-6 mb-6 lg:mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            <div className="bg-gradient-to-br from-green-500 to-green-400 rounded-2xl lg:rounded-3xl p-5 lg:p-6 relative overflow-hidden">
              <Leaf size={64} className="absolute -bottom-4 -right-4 text-white/15 lg:w-24 lg:h-24" />
              <p className="text-white/80 text-xs lg:text-sm font-medium">Organic</p>
              <p className="text-white font-bold text-base lg:text-xl mt-0.5">Farm Fresh Picks</p>
              <button
                onClick={() => setCategory('vegetables')}
                className="mt-3 text-xs lg:text-sm bg-white/20 text-white font-semibold px-4 py-2 rounded-xl hover:bg-white/30 transition-colors"
              >
                Shop Now
              </button>
            </div>
            <div className="bg-gradient-to-br from-orange-400 to-amber-400 rounded-2xl lg:rounded-3xl p-5 lg:p-6 relative overflow-hidden">
              <Coffee size={64} className="absolute -bottom-4 -right-4 text-white/15 lg:w-24 lg:h-24" />
              <p className="text-white/80 text-xs lg:text-sm font-medium">Morning</p>
              <p className="text-white font-bold text-base lg:text-xl mt-0.5">Breakfast Essentials</p>
              <button
                onClick={() => setCategory('bakery')}
                className="mt-3 text-xs lg:text-sm bg-white/20 text-white font-semibold px-4 py-2 rounded-xl hover:bg-white/30 transition-colors"
              >
                Shop Now
              </button>
            </div>
            <div className="hidden lg:block bg-gradient-to-br from-blue-500 to-cyan-400 rounded-3xl p-6 relative overflow-hidden">
              <TrendingUp size={64} className="absolute -bottom-4 -right-4 text-white/15" />
              <p className="text-white/80 text-sm font-medium">Hot Deals</p>
              <p className="text-white font-bold text-xl mt-0.5">Weekend Specials</p>
              <button
                onClick={() => navigate('categories')}
                className="mt-3 text-sm bg-white/20 text-white font-semibold px-4 py-2 rounded-xl hover:bg-white/30 transition-colors"
              >
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom spacer for nav */}
      <div className="h-4 lg:h-8" />
    </div>
  );
}
