import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Building2, Filter, ChevronDown, Grid3X3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getBrandsBySubcategory, getSubcategoryBySlug, getCategoryBySlug, getProductsByBrand } from '../lib/data';
import type { Brand, Subcategory, Category, ProductWithVariants } from '../lib/supabase';
import ProductCard from '../components/ProductCard';

export default function BrandsPage() {
  const { state, navigate, setCategory } = useApp();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [category, setCategoryState] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  // New states for active brand and its products
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'discount'>('popular');
  const [showSort, setShowSort] = useState(false);

  // Fetch subcategory and brands in current subcategory
  useEffect(() => {
    async function fetchData() {
      if (!state.selectedSubcategorySlug) return;

      setLoading(true);
      try {
        const subData = await getSubcategoryBySlug(state.selectedSubcategorySlug!);
        setSubcategory(subData);

        if (subData) {
          const [brandData, catData] = await Promise.all([
            getBrandsBySubcategory(state.selectedSubcategorySlug!),
            getCategoryBySlug(state.selectedCategorySlug!),
          ]);
          setBrands(brandData);
          setCategoryState(catData);

          // Select the first brand by default
          if (brandData.length > 0) {
            setActiveBrand(brandData[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch brands:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [state.selectedSubcategorySlug, state.selectedCategorySlug]);

  // Fetch products when active brand changes
  useEffect(() => {
    async function fetchProducts() {
      if (!activeBrand) return;

      setProductsLoading(true);
      try {
        const prodData = await getProductsByBrand(activeBrand.slug);
        setProducts(prodData);
      } catch (err) {
        console.error('Failed to fetch products for brand:', err);
      } finally {
        setProductsLoading(false);
      }
    }

    fetchProducts();
  }, [activeBrand]);

  const handleBack = () => {
    if (state.selectedCategorySlug) {
      setCategory(state.selectedCategorySlug);
    }
  };

  // Sort products logic
  const sortedProducts = [...products].sort((a, b) => {
    const aPrice = a.variants?.[0]?.price || 0;
    const bPrice = b.variants?.[0]?.price || 0;
    const aDiscount = a.variants?.[0]?.discount || 0;
    const bDiscount = b.variants?.[0]?.discount || 0;

    if (sortBy === 'price-low') return aPrice - bPrice;
    if (sortBy === 'price-high') return bPrice - aPrice;
    if (sortBy === 'discount') return bDiscount - aDiscount;
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-4 lg:pb-8 bg-neutral-50 min-h-screen">
      {/* Mobile Sticky Header Wrapper (Combines Title & Horizontal Tabs to avoid scroll separation) */}
      <div className="lg:hidden sticky top-[104px] z-40 bg-white border-b border-neutral-100 shadow-sm">
        {/* Title bar */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center active:bg-neutral-200 transition-colors"
            >
              <ArrowLeft size={18} className="text-neutral-700" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-neutral-800">{subcategory?.name || 'Brands'}</h2>
              <p className="text-xs text-neutral-500 capitalize">{category?.name} • {brands.length} brands</p>
            </div>
          </div>
          {activeBrand && (
            <button
              onClick={() => setShowSort(s => !s)}
              className="flex items-center gap-1 bg-neutral-100 rounded-xl px-2.5 py-1.5 active:bg-neutral-200 transition-colors"
            >
              <Filter size={12} className="text-neutral-600" />
              <span className="text-xs font-medium text-neutral-700">Sort</span>
              <ChevronDown size={12} className="text-neutral-500" />
            </button>
          )}
        </div>

        {/* Brand horizontal tabs */}
        {brands.length > 0 && (
          <div className="px-4 pb-3 flex gap-2.5 overflow-x-auto scrollbar-none">
            {brands.map(brand => {
              const isActive = activeBrand?.id === brand.id;
              return (
                <button
                  key={brand.id}
                  onClick={() => setActiveBrand(brand)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all flex-shrink-0 active:scale-95 ${
                    isActive
                      ? 'bg-primary-500 border-primary-500 text-white font-semibold shadow-sm'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {brand.logo && (
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-white flex-shrink-0 flex items-center justify-center border border-white">
                      <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <span className="text-xs whitespace-nowrap">{brand.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Top Header & Breadcrumbs */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
          <button onClick={() => navigate('home')} className="hover:text-primary-600">Home</button>
          <ArrowRight size={12} />
          <button onClick={() => state.selectedCategorySlug && setCategory(state.selectedCategorySlug)} className="hover:text-primary-600 capitalize">
            {category?.name}
          </button>
          <ArrowRight size={12} />
          <span className="text-neutral-800 font-medium">{subcategory?.name}</span>
        </div>
        <h2 className="text-2xl font-bold text-neutral-800">{subcategory?.name}</h2>
        <p className="text-sm text-neutral-500 mt-1">{brands.length} brands available in this section</p>
      </div>

      {/* Sort Dropdown - Mobile */}
      {showSort && (
        <div className="lg:hidden mx-4 bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden mb-3 mt-1">
          {[
            { id: 'popular', label: 'Most Popular' },
            { id: 'price-low', label: 'Price: Low to High' },
            { id: 'price-high', label: 'Price: High to Low' },
            { id: 'discount', label: 'Best Discount' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => { setSortBy(s.id as typeof sortBy); setShowSort(false); }}
              className={`w-full text-left px-4 py-3 text-sm border-b border-neutral-50 last:border-0 transition-colors ${
                sortBy === s.id ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-neutral-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Main View Container */}
      <div className="px-4 lg:px-6 mt-3 lg:mt-6">
        <div className="max-w-7xl mx-auto">
          {brands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-3xl shadow-card border border-neutral-100">
              <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center">
                <Building2 size={32} className="text-neutral-300" />
              </div>
              <p className="text-neutral-500 text-sm font-medium">No brands available</p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Desktop Left Sidebar: Brands List */}
              <div className="hidden lg:block w-64 flex-shrink-0">
                <div className="bg-white border border-neutral-100 rounded-3xl p-4 shadow-card sticky top-[84px] max-h-[calc(100vh-120px)] overflow-y-auto">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4 px-2">Brands</h3>
                  <div className="flex flex-col gap-1">
                    {brands.map(brand => {
                      const isActive = activeBrand?.id === brand.id;
                      return (
                        <button
                          key={brand.id}
                          onClick={() => setActiveBrand(brand)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all text-left border ${
                            isActive
                              ? 'bg-primary-50/70 border-primary-100 text-primary-700 font-semibold shadow-sm'
                              : 'bg-transparent border-transparent text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border transition-all ${
                            isActive ? 'bg-white border-primary-200' : 'bg-neutral-50 border-neutral-100'
                          }`}>
                            {brand.logo ? (
                              <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                            ) : (
                              <Building2 size={16} className="text-neutral-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-tight truncate">{brand.name}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Content Area: Brand Products Grid */}
              <div className="flex-1 min-w-0">
                {activeBrand && (
                  <div>
                    {/* Header bar of selected brand */}
                    <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-5">
                      <div className="flex items-center gap-3">
                        {activeBrand.logo && (
                          <div className="w-10 h-10 rounded-2xl bg-white overflow-hidden border border-neutral-200 p-0.5 flex items-center justify-center">
                            <img src={activeBrand.logo} alt={activeBrand.name} className="max-w-full max-h-full object-contain" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-base font-bold text-neutral-800">{activeBrand.name}</h3>
                          <p className="text-[11px] text-neutral-400">
                            {productsLoading ? 'Loading products...' : `${products.length} products available`}
                          </p>
                        </div>
                      </div>

                      {/* Desktop Sort button */}
                      <div className="hidden lg:block relative">
                        <button
                          onClick={() => setShowSort(s => !s)}
                          className="flex items-center gap-2 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-2 transition-all text-xs font-semibold text-neutral-700 shadow-sm"
                        >
                          <Filter size={14} className="text-neutral-500" />
                          <span>Sort by: {sortBy === 'popular' ? 'Popular' : sortBy === 'price-low' ? 'Price: Low' : sortBy === 'price-high' ? 'Price: High' : 'Discount'}</span>
                          <ChevronDown size={12} className="text-neutral-400" />
                        </button>
                        {showSort && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden z-50">
                            {[
                              { id: 'popular', label: 'Most Popular' },
                              { id: 'price-low', label: 'Price: Low to High' },
                              { id: 'price-high', label: 'Price: High to Low' },
                              { id: 'discount', label: 'Best Discount' },
                            ].map(s => (
                              <button
                                key={s.id}
                                onClick={() => { setSortBy(s.id as typeof sortBy); setShowSort(false); }}
                                className={`w-full text-left px-4 py-2.5 text-xs border-b border-neutral-50 last:border-0 transition-colors ${
                                  sortBy === s.id ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-neutral-600 hover:bg-neutral-50'
                                }`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Loading or products view */}
                    {productsLoading ? (
                      <div className="flex flex-wrap gap-4 py-8">
                        {[1, 2, 3, 4].map(n => (
                          <div key={n} className="bg-white border border-neutral-100 rounded-2xl w-40 lg:w-44 h-56 animate-pulse" />
                        ))}
                      </div>
                    ) : sortedProducts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-3xl border border-neutral-100 shadow-card">
                        <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center">
                          <Grid3X3 size={24} className="text-neutral-300" />
                        </div>
                        <p className="text-neutral-500 text-sm font-medium">No products available for this brand</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3.5 lg:gap-4 justify-start">
                        {sortedProducts.map(p => (
                          <ProductCard key={p.id} product={p} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
