import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Filter,
  ChevronDown,
  Sparkles,
  ShoppingBag,
  Leaf,
  Check,
  Building2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getSubcategoryBySlug,
  getCategoryBySlug,
  getSubcategoriesByCategory,
  getBrandsBySubcategory,
  getProductsBySubcategory,
} from '../lib/data';
import type { Brand, Subcategory, Category, ProductWithVariants } from '../lib/supabase';
import ZeptoProductCard from '../components/ZeptoProductCard';

export default function BrandsPage() {
  const { state, navigate, setCategory, setSubcategory } = useApp();
  const [subcategory, setSubcategoryState] = useState<Subcategory | null>(null);
  const [category, setCategoryState] = useState<Category | null>(null);
  const [siblingSubcategories, setSiblingSubcategories] = useState<Subcategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('all');
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'discount'>('popular');
  const [showSort, setShowSort] = useState(false);

  // Fetch category, subcategories, brands, and products
  useEffect(() => {
    async function fetchData() {
      if (!state.selectedSubcategorySlug) return;

      setLoading(true);
      try {
        const [subData, catData] = await Promise.all([
          getSubcategoryBySlug(state.selectedSubcategorySlug),
          state.selectedCategorySlug ? getCategoryBySlug(state.selectedCategorySlug) : Promise.resolve(null),
        ]);

        setSubcategoryState(subData);
        setCategoryState(catData);

        // Fetch sibling subcategories if category is available
        if (state.selectedCategorySlug) {
          const siblings = await getSubcategoriesByCategory(state.selectedCategorySlug);
          setSiblingSubcategories(siblings);
        }

        // Fetch products and brands for current subcategory
        const [prodData, brandData] = await Promise.all([
          getProductsBySubcategory(state.selectedSubcategorySlug),
          getBrandsBySubcategory(state.selectedSubcategorySlug),
        ]);

        setProducts(prodData);
        setBrands(brandData);
        setSelectedBrandId('all');
      } catch (err) {
        console.error('Failed to fetch category products:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [state.selectedSubcategorySlug, state.selectedCategorySlug]);

  const handleBack = () => {
    if (state.selectedCategorySlug) {
      setCategory(state.selectedCategorySlug);
    } else {
      navigate('categories');
    }
  };

  const handleSubcategorySelect = (slug: string) => {
    if (slug !== state.selectedSubcategorySlug) {
      setSubcategory(slug);
    }
  };

  // Filter products by selected brand
  const filteredProducts = products.filter((p) => {
    if (selectedBrandId === 'all') return true;
    return p.brand_id === selectedBrandId || p.brand?.id === selectedBrandId;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aPrice = a.variants?.[0]?.price || 0;
    const bPrice = b.variants?.[0]?.price || 0;
    const aDiscount = a.variants?.[0]?.discount || 0;
    const bDiscount = b.variants?.[0]?.discount || 0;

    if (sortBy === 'price-low') return aPrice - bPrice;
    if (sortBy === 'price-high') return bPrice - aPrice;
    if (sortBy === 'discount') return bDiscount - aDiscount;
    return 0; // 'popular'
  });

  const sortOptions = [
    { id: 'popular', label: 'Most Popular' },
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
    { id: 'discount', label: 'Best Discount' },
  ];

  const currentSortLabel = sortOptions.find((s) => s.id === sortBy)?.label || 'Most Popular';

  return (
    <div className="min-h-screen bg-neutral-50 pb-16 lg:pb-12">
      {/* ========================================================= */}
      {/* MOBILE STICKY HEADER & SUBCATEGORY BAR */}
      {/* ========================================================= */}
      {/* Title row — deliberately NOT sticky. The app header is already fixed
          at 104px; pinning this as well froze about a third of a phone screen,
          so scrolling barely moved anything and felt stuck. */}
      <div className="lg:hidden bg-white border-b border-neutral-100">
        {/* Row 1: Back, Title, Count, Sort Button */}
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={handleBack}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center flex-shrink-0 active:scale-95 transition-all text-neutral-700"
              aria-label="Back"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-neutral-900 truncate leading-tight">
                {subcategory?.name || 'Products'}
              </h1>
              <p className="text-[11px] text-neutral-500 capitalize leading-tight">
                {category?.name || 'Store'} • {sortedProducts.length} items
              </p>
            </div>
          </div>

          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowSort((s) => !s)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 active:scale-95 transition-all text-xs font-semibold text-neutral-700 border border-neutral-200/60"
            >
              <Filter size={11} className="text-emerald-700" />
              <span>Sort</span>
              <ChevronDown size={12} className="text-neutral-500" />
            </button>

            {/* Mobile Sort Dropdown */}
            {showSort && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-neutral-200/80 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2 border-b border-neutral-100 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Sort By
                </div>
                {sortOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSortBy(opt.id as typeof sortBy);
                      setShowSort(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition-colors ${
                      sortBy === opt.id
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-neutral-700 hover:bg-neutral-50 font-medium'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.id && <Check size={14} className="text-emerald-700" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Only the filters stay pinned — that is what you actually reach for
          while scrolling a long list. */}
      {(siblingSubcategories.length > 1 || brands.length > 1) && (
      <div className="lg:hidden sticky top-[104px] z-30 bg-white border-b border-neutral-100 shadow-xs">
        {/* Row 2: Horizontal Sibling Subcategories Rail (Mobile) */}
        {siblingSubcategories.length > 1 && (
          <div className="px-3 py-2 flex gap-2 overflow-x-auto scrollbar-none">
            {siblingSubcategories.map((sub) => {
              const isActive = sub.slug === state.selectedSubcategorySlug;
              return (
                <button
                  key={sub.id}
                  onClick={() => handleSubcategorySelect(sub.slug)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all flex-shrink-0 active:scale-95 ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-200'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium'
                  }`}
                >
                  {sub.image && (
                    <img
                      src={sub.image}
                      alt={sub.name}
                      className="w-4 h-4 rounded-full object-cover border border-white/40"
                    />
                  )}
                  <span>{sub.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Row 3: Optional Brand Filter Chips (Mobile) */}
        {brands.length > 1 && (
          <div className="px-3 pb-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-t border-neutral-100 pt-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mr-1 flex-shrink-0">
              Farm:
            </span>
            <button
              onClick={() => setSelectedBrandId('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex-shrink-0 ${
                selectedBrandId === 'all'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All ({products.length})
            </button>
            {brands.map((b) => {
              const isSelected = selectedBrandId === b.id;
              const count = products.filter((p) => p.brand_id === b.id || p.brand?.id === b.id).length;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBrandId(b.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex-shrink-0 ${
                    isSelected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {b.name} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* ========================================================= */}
      {/* DESKTOP TOP HEADER & BREADCRUMBS */}
      {/* ========================================================= */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 pt-6 pb-4">
        {/* Breadcrumb row */}
        <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 mb-4">
          <button
            onClick={() => navigate('home')}
            className="hover:text-emerald-700 transition-colors"
          >
            Home
          </button>
          <ArrowRight size={11} className="text-neutral-400" />
          <button
            onClick={() => state.selectedCategorySlug && setCategory(state.selectedCategorySlug)}
            className="hover:text-emerald-700 transition-colors capitalize"
          >
            {category?.name || 'Category'}
          </button>
          <ArrowRight size={11} className="text-neutral-400" />
          <span className="text-neutral-900 font-bold">{subcategory?.name || 'Products'}</span>
        </div>

        {/* Title and Sort Bar */}
        <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs">
              {subcategory?.image ? (
                <img
                  src={subcategory.image}
                  alt={subcategory.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Leaf size={28} className="text-emerald-700" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
                  {subcategory?.name || 'Fresh Products'}
                </h1>
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <Sparkles size={11} />
                  100% Farm Fresh
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Showing {sortedProducts.length} items handpicked daily for maximum freshness & quality
              </p>
            </div>
          </div>

          {/* Desktop Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSort((s) => !s)}
              className="flex items-center gap-2 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-neutral-700 shadow-xs hover:border-emerald-300 transition-all"
            >
              <Filter size={13} className="text-emerald-700" />
              <span>Sort by: {currentSortLabel}</span>
              <ChevronDown size={13} className="text-neutral-400" />
            </button>

            {showSort && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2.5 border-b border-neutral-100 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Sort Products
                </div>
                {sortOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSortBy(opt.id as typeof sortBy);
                      setShowSort(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-xs text-left transition-colors ${
                      sortBy === opt.id
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-neutral-700 hover:bg-neutral-50 font-medium'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.id && <Check size={14} className="text-emerald-700" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MAIN TWO-COLUMN LAYOUT (DESKTOP & RESPONSIVE) */}
      {/* ========================================================= */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 mt-2 lg:mt-2">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ===================================================== */}
          {/* DESKTOP LEFT SIDEBAR: SUBCATEGORIES & BRANDS */}
          {/* ===================================================== */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-[88px] flex flex-col gap-4">
              {/* Sibling Subcategories Rail */}
              <div className="bg-white rounded-3xl border border-neutral-200/80 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3 px-2">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    {category?.name ? `${category.name}` : 'Categories'}
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {siblingSubcategories.length} sections
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {siblingSubcategories.map((sub) => {
                    const isActive = sub.slug === state.selectedSubcategorySlug;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleSubcategorySelect(sub.slug)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all text-left border ${
                          isActive
                            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900 font-bold shadow-xs'
                            : 'bg-transparent border-transparent text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 font-medium'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border transition-all ${
                            isActive ? 'bg-white border-emerald-300' : 'bg-neutral-50 border-neutral-100'
                          }`}
                        >
                          {sub.image ? (
                            <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" />
                          ) : (
                            <Leaf size={16} className="text-emerald-700" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate">{sub.name}</p>
                        </div>
                        {isActive && (
                          <div className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brands Filter in Sidebar (if brands exist) */}
              {brands.length > 0 && (
                <div className="bg-white rounded-3xl border border-neutral-200/80 p-4 shadow-xs">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 px-2">
                    Filter by Farm / Brand
                  </h3>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setSelectedBrandId('all')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                        selectedBrandId === 'all'
                          ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                          : 'text-neutral-600 hover:bg-neutral-50 font-medium'
                      }`}
                    >
                      <span>All Products</span>
                      <span className="text-[10px] text-neutral-400 font-semibold">({products.length})</span>
                    </button>
                    {brands.map((b) => {
                      const isSelected = selectedBrandId === b.id;
                      const count = products.filter(
                        (p) => p.brand_id === b.id || p.brand?.id === b.id
                      ).length;
                      return (
                        <button
                          key={b.id}
                          onClick={() => setSelectedBrandId(b.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                              : 'text-neutral-600 hover:bg-neutral-50 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {b.logo ? (
                              <img
                                src={b.logo}
                                alt={b.name}
                                className="w-4 h-4 rounded-full object-cover border border-neutral-200"
                              />
                            ) : (
                              <Building2 size={13} className="text-neutral-400" />
                            )}
                            <span className="truncate">{b.name}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-semibold">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ===================================================== */}
          {/* MAIN PRODUCT LISTING AREA */}
          {/* ===================================================== */}
          <div className="flex-1 min-w-0">
            {/* Desktop Brand Filter Pills */}
            {brands.length > 1 && (
              <div className="hidden lg:flex items-center gap-2 mb-4">
                <button
                  onClick={() => setSelectedBrandId('all')}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
                    selectedBrandId === 'all'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  All ({products.length})
                </button>
                {brands.map((b) => {
                  const isSelected = selectedBrandId === b.id;
                  const count = products.filter((p) => p.brand_id === b.id || p.brand?.id === b.id).length;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBrandId(b.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {b.logo && (
                        <img
                          src={b.logo}
                          alt={b.name}
                          className="w-4 h-4 rounded-full object-cover border border-white/60"
                        />
                      )}
                      <span>{b.name}</span>
                      <span className={isSelected ? 'text-emerald-100' : 'text-neutral-400'}>
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Loading Skeletons */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-neutral-200/80 p-2.5 flex flex-col gap-2 animate-pulse"
                  >
                    <div className="w-full h-24 bg-neutral-200 rounded-xl" />
                    <div className="w-12 h-3.5 bg-neutral-200 rounded" />
                    <div className="w-full h-3.5 bg-neutral-200 rounded" />
                    <div className="w-16 h-4 bg-neutral-200 rounded mt-auto" />
                  </div>
                ))}
              </div>
            ) : sortedProducts.length === 0 ? (
              /* Empty State */
              <div className="bg-white rounded-3xl border border-neutral-200/80 p-12 text-center shadow-xs flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                  <ShoppingBag size={28} className="text-emerald-600" />
                </div>
                <h3 className="text-base font-bold text-neutral-800 mb-1">
                  No products found
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mb-5">
                  We currently don&apos;t have items for the selected filter. Try clearing the filter or browsing our other sections.
                </p>
                {selectedBrandId !== 'all' ? (
                  <button
                    onClick={() => setSelectedBrandId('all')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm"
                  >
                    View All {subcategory?.name}
                  </button>
                ) : (
                  <button
                    onClick={handleBack}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm"
                  >
                    Browse Categories
                  </button>
                )}
              </div>
            ) : (
              /* Product Grid */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
                {sortedProducts.map((prod) => (
                  <ZeptoProductCard
                    key={prod.id}
                    product={prod}
                    className="w-full"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
