import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  ChevronRight,
  Search,
  Sparkles,
  Zap,
  Grid3X3,
  LayoutList,
  SlidersHorizontal,
  Package,
  Clock,
  ShieldCheck,
  ShoppingBag,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getCategories,
  getAllSubcategories,
  getSubcategoriesByCategory,
  getProductsByCategory,
  getFeaturedProducts,
} from '../lib/data';
import type { Category, Subcategory, ProductWithVariants } from '../lib/supabase';
import ProductCard from '../components/ProductCard';

export default function CategoriesPage() {
  const { navigate, setCategory, setSubcategory } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategoriesMap, setSubcategoriesMap] = useState<Record<string, Subcategory[]>>({});
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'split'>('grid');

  // Quick Shop (Split-view) states
  const [splitCatSlug, setSplitCatSlug] = useState<string | null>(null);
  const [splitSubcategories, setSplitSubcategories] = useState<Subcategory[]>([]);
  const [splitProducts, setSplitProducts] = useState<ProductWithVariants[]>([]);
  const [selectedSplitSubcat, setSelectedSplitSubcat] = useState<string>('all');
  const [splitLoading, setSplitLoading] = useState(false);

  useEffect(() => {
    async function initData() {
      setLoading(true);
      try {
        const [cats, allSubs, featured] = await Promise.all([
          getCategories(),
          getAllSubcategories(),
          getFeaturedProducts(),
        ]);

        setCategories(cats);
        setFeaturedProducts(featured);

        // Group subcategories by category
        const subMap: Record<string, Subcategory[]> = {};
        for (const cat of cats) {
          const matchingSubs = allSubs.filter(
            (s) =>
              s.category_id === cat.id ||
              (s.category && (s.category.id === cat.id || s.category.slug === cat.slug))
          );
          subMap[cat.slug] = matchingSubs;
        }
        setSubcategoriesMap(subMap);

        if (cats.length > 0) {
          setSplitCatSlug(cats[0].slug);
        }
      } catch (err) {
        console.error('Failed to load categories data:', err);
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, []);

  // Fetch subcategories & products whenever splitCatSlug changes in Quick Shop mode
  useEffect(() => {
    async function loadSplitContent() {
      if (!splitCatSlug) return;
      setSplitLoading(true);
      setSelectedSplitSubcat('all');
      try {
        const [subs, prods] = await Promise.all([
          getSubcategoriesByCategory(splitCatSlug),
          getProductsByCategory(splitCatSlug),
        ]);
        setSplitSubcategories(subs);
        setSplitProducts(prods);
      } catch (err) {
        console.error('Failed to load split category content:', err);
      } finally {
        setSplitLoading(false);
      }
    }

    if (viewMode === 'split') {
      loadSplitContent();
    }
  }, [splitCatSlug, viewMode]);

  const handleOpenSubcategory = (catSlug: string, subSlug: string) => {
    setCategory(catSlug);
    setSubcategory(subSlug);
  };

  // Dynamically filtered categories based on search & category chip
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const q = searchQuery.toLowerCase().trim();
      const subs = subcategoriesMap[cat.slug] || [];
      const hasSubMatch = subs.some((s) => s.name.toLowerCase().includes(q));

      const matchesSearch =
        !q ||
        cat.name.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q) ||
        hasSubMatch;

      if (!matchesSearch) return false;

      if (selectedFilter !== 'all') {
        return cat.slug === selectedFilter;
      }

      return true;
    });
  }, [categories, searchQuery, selectedFilter, subcategoriesMap]);

  // Filter products in Split View by chosen subcategory pill
  const filteredSplitProducts = useMemo(() => {
    if (selectedSplitSubcat === 'all') return splitProducts;
    const activeSub = splitSubcategories.find((s) => s.slug === selectedSplitSubcat);
    if (!activeSub) return splitProducts;

    return splitProducts.filter((p) => {
      return (
        p.subcategory_id === activeSub.id ||
        (p.tags && p.tags.some((t) => t.toLowerCase() === activeSub.slug.toLowerCase()))
      );
    });
  }, [splitProducts, selectedSplitSubcat, splitSubcategories]);

  const activeSplitCategory = categories.find((c) => c.slug === splitCatSlug) || categories[0];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-neutral-500 font-semibold tracking-wide">Loading grocery aisles...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-5 space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. BREADCRUMB & HEADER SECTION
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav className="hidden lg:flex items-center gap-2 text-xs text-neutral-400 mb-1.5 font-medium">
            <button onClick={() => navigate('home')} className="hover:text-primary-600 transition-colors">
              Home
            </button>
            <ArrowRight size={12} />
            <span className="text-neutral-800 font-bold">Categories</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 shadow-sm flex-shrink-0">
              <Grid3X3 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl lg:text-3xl font-extrabold text-neutral-900 tracking-tight">
                  Grocery Aisles & Categories
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                  <Zap size={11} className="fill-emerald-700 text-emerald-700" />
                  10-15 Min Delivery
                </span>
              </div>
              <p className="text-xs lg:text-sm text-neutral-500 mt-0.5">
                Shop from {categories.length} fresh grocery aisles with instant express delivery
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle & Offers link */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="bg-neutral-100/90 p-1 rounded-2xl flex items-center border border-neutral-200 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Grid3X3 size={15} />
              <span>Aisles Grid</span>
            </button>
            <button
              onClick={() => {
                setViewMode('split');
                if (!splitCatSlug && categories[0]) setSplitCatSlug(categories[0].slug);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'split'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <LayoutList size={15} />
              <span>Quick Shop</span>
            </button>
          </div>

          <button
            onClick={() => navigate('offers')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors shadow-sm"
          >
            <Sparkles size={14} className="text-amber-600 fill-amber-500" />
            <span>Deals</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SEARCH & DYNAMIC CATEGORY FILTER CHIPS
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-3.5 border border-neutral-200 shadow-sm space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories (e.g. Snacks, Milk, Beverages, Chips, Juices)..."
            className="w-full pl-10 pr-16 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs sm:text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:bg-white transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-500 hover:text-neutral-800 bg-neutral-200/60 px-2 py-0.5 rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Dynamic Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-neutral-400 font-semibold flex items-center gap-1 flex-shrink-0 pr-1">
            <SlidersHorizontal size={13} />
            Filter:
          </span>

          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedFilter === 'all'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200'
            }`}
          >
            <span>All Aisles</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                selectedFilter === 'all' ? 'bg-primary-700 text-white' : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              {categories.length}
            </span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedFilter === cat.slug;
            const subCount = (subcategoriesMap[cat.slug] || []).length || cat.subcategory_count || 0;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedFilter(isSelected ? 'all' : cat.slug)}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200'
                }`}
              >
                <span>{cat.name}</span>
                {subCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-primary-700 text-white' : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {subCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          EMPTY STATE FOR SEARCH / FILTER
      ───────────────────────────────────────────────────────────── */}
      {filteredCategories.length === 0 && (
        <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
            <Package size={32} />
          </div>
          <h3 className="text-base font-bold text-neutral-800">No categories found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            We couldn't find any category matching "{searchQuery}". Try searching for snacks, dairy, juices, or clear the filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedFilter('all');
            }}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE 1: BLINKIT-STYLE QUICK SHOP (Interactive Split-View)
      ───────────────────────────────────────────────────────────── */}
      {viewMode === 'split' && filteredCategories.length > 0 && (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
          {/* Mobile Category Horizontal Rail */}
          <div className="md:hidden flex items-center gap-2 p-3 overflow-x-auto bg-neutral-50 border-b border-neutral-200 no-scrollbar">
            {filteredCategories.map((cat) => {
              const isSelected = splitCatSlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSplitCatSlug(cat.slug)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl flex-shrink-0 transition-all ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-sm font-bold'
                      : 'bg-white text-neutral-700 border border-neutral-200'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 ${cat.bg_color || 'bg-amber-100'}`}>
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover mix-blend-multiply" />
                  </div>
                  <span className="text-xs">{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Left Rail: Category List */}
          <div className="hidden md:block w-64 lg:w-72 bg-neutral-50/80 border-r border-neutral-200 flex-shrink-0 p-3 overflow-y-auto max-h-[750px]">
            <div className="flex items-center justify-between px-3 py-2 mb-1">
              <p className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-wider">
                Select Category
              </p>
              <span className="text-[10px] font-bold text-neutral-400 bg-neutral-200/60 px-1.5 py-0.5 rounded-md">
                {filteredCategories.length}
              </span>
            </div>

            <div className="space-y-1.5">
              {filteredCategories.map((cat) => {
                const isSelected = splitCatSlug === cat.slug;
                const subs = subcategoriesMap[cat.slug] || [];
                const subCount = subs.length || cat.subcategory_count || 0;
                const prodCount = cat.product_count || (subs.reduce((acc, s) => acc + (s.product_count || 0), 0) || 12);

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSplitCatSlug(cat.slug)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition-all ${
                      isSelected
                        ? 'bg-white text-primary-700 font-extrabold shadow-sm border border-primary-200/80 ring-2 ring-primary-500/10'
                        : 'text-neutral-600 hover:bg-neutral-100/90 hover:text-neutral-900 border border-transparent'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 ${
                        cat.bg_color || 'bg-amber-100'
                      } shadow-sm`}
                    >
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover mix-blend-multiply"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate leading-tight">{cat.name}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        {subCount} Subcategories • {prodCount} items
                      </p>
                    </div>
                    {isSelected && <ChevronRight size={16} className="text-primary-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Content Area: Active Category Header, Subcategories & Products */}
          <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-6">
            {activeSplitCategory && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-2xl overflow-hidden ${
                      activeSplitCategory.bg_color || 'bg-amber-100'
                    } flex-shrink-0 shadow-sm`}
                  >
                    <img
                      src={activeSplitCategory.image}
                      alt={activeSplitCategory.name}
                      className="w-full h-full object-cover mix-blend-multiply"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg lg:text-2xl font-black text-neutral-900">
                      {activeSplitCategory.name}
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {splitSubcategories.length} Subcategories • {filteredSplitProducts.length} Items ready for 10-min delivery
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setCategory(activeSplitCategory.slug)}
                  className="px-4 py-2 bg-primary-50 hover:bg-primary-500 text-primary-700 hover:text-white border border-primary-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto shadow-sm active:scale-95"
                >
                  <span>Explore Full Aisle</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            {/* Subcategory In-Place Filter Pills */}
            {splitSubcategories.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={13} className="text-primary-600" />
                    <span>Filter By Subcategory</span>
                  </h3>
                  <span className="text-[11px] text-neutral-400">Tap to filter items</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedSplitSubcat('all')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedSplitSubcat === 'all'
                        ? 'bg-neutral-900 text-white shadow-sm'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    <span>All Items</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        selectedSplitSubcat === 'all' ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {splitProducts.length}
                    </span>
                  </button>

                  {splitSubcategories.map((sub) => {
                    const isSelected = selectedSplitSubcat === sub.slug;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSplitSubcat(isSelected ? 'all' : sub.slug)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                            : 'bg-neutral-50 hover:bg-primary-50 text-neutral-700 border-neutral-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-md overflow-hidden flex-shrink-0 bg-neutral-200">
                          <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" />
                        </div>
                        <span>{sub.name}</span>
                        {sub.product_count && (
                          <span
                            className={`text-[10px] px-1 py-0.2 rounded-full ${
                              isSelected ? 'bg-primary-700 text-white' : 'bg-neutral-200 text-neutral-600'
                            }`}
                          >
                            {sub.product_count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Direct Product Cards Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag size={14} className="text-primary-600" />
                  <span>
                    {selectedSplitSubcat === 'all'
                      ? 'Popular Groceries'
                      : splitSubcategories.find((s) => s.slug === selectedSplitSubcat)?.name || 'Groceries'}
                  </span>
                </h3>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                  ⚡ 10-Min Fast Delivery
                </span>
              </div>

              {splitLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-neutral-400">Loading aisle products...</p>
                </div>
              ) : filteredSplitProducts.length === 0 ? (
                <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2">
                  <Package size={28} className="mx-auto text-neutral-300" />
                  <p className="text-xs font-semibold text-neutral-600">No products available in this selection</p>
                  <p className="text-[11px] text-neutral-400">Try selecting 'All Items' or explore another aisle</p>
                  <button
                    onClick={() => setSelectedSplitSubcat('all')}
                    className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg text-xs font-bold transition-colors"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                  {filteredSplitProducts.slice(0, 16).map((prod) => (
                    <ProductCard key={prod.id} product={prod} className="w-full" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE 2: FULL AISLES GRID ( zepto / blinkit style cards )
      ───────────────────────────────────────────────────────────── */}
      {viewMode === 'grid' && filteredCategories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {filteredCategories.map((cat) => {
            const topSubs = subcategoriesMap[cat.slug] || [];
            const subCount = topSubs.length || cat.subcategory_count || 0;
            const prodCount = cat.product_count || 12;

            return (
              <div
                key={cat.id}
                className="bg-white rounded-3xl border border-neutral-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Category Banner Card */}
                  <div
                    onClick={() => setCategory(cat.slug)}
                    className={`${
                      cat.bg_color || 'bg-amber-100'
                    } h-40 relative overflow-hidden cursor-pointer flex items-center justify-center`}
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-108 transition-transform duration-500"
                      loading="lazy"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60" />

                    {/* Delivery badge */}
                    <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-neutral-900 text-[10px] font-black px-2.5 py-1 rounded-xl shadow-sm flex items-center gap-1">
                      <Clock size={11} className="text-primary-600 stroke-[2.5]" />
                      <span>10-15 MINS</span>
                    </span>

                    {/* Items badge */}
                    <span className="absolute top-3 right-3 bg-neutral-900/80 backdrop-blur-md text-white text-[10px] font-extrabold px-2 py-0.8 rounded-xl shadow-sm">
                      {prodCount} Items
                    </span>
                  </div>

                  {/* Body & Subcategories */}
                  <div className="p-4">
                    <div onClick={() => setCategory(cat.slug)} className="cursor-pointer">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-neutral-900 group-hover:text-primary-600 transition-colors">
                          {cat.name}
                        </h3>
                        <span className="text-[11px] font-bold text-neutral-400">
                          {subCount} Aisles
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                        Farm fresh groceries, staples & daily needs
                      </p>
                    </div>

                    {/* Quick Subcategory Pills */}
                    {topSubs.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {topSubs.slice(0, 4).map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSubcategory(cat.slug, sub.slug);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-neutral-50 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300 border border-neutral-200 text-[11px] font-semibold text-neutral-600 transition-all flex items-center gap-1 shadow-2xs"
                          >
                            <span>{sub.name}</span>
                          </button>
                        ))}
                        {topSubs.length > 4 && (
                          <span className="px-2 py-1 rounded-xl bg-neutral-100 text-[10px] font-bold text-neutral-500">
                            +{topSubs.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0">
                  <button
                    type="button"
                    onClick={() => setCategory(cat.slug)}
                    className="w-full py-2.5 bg-neutral-50 hover:bg-primary-500 text-neutral-800 hover:text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 group/btn border border-neutral-200 hover:border-primary-500"
                  >
                    <span>Browse Aisle</span>
                    <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. TOP SELLING ESSENTIALS ACROSS CATEGORIES
      ───────────────────────────────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <div className="pt-6 border-t border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Zap size={18} className="fill-amber-500 text-amber-500" />
              </div>
              <div>
                <h2 className="text-base lg:text-lg font-black text-neutral-900">
                  Top Selling Essentials Across Aisles
                </h2>
                <p className="text-xs text-neutral-500">Frequently reordered items with guaranteed fast delivery</p>
              </div>
            </div>

            <button
              onClick={() => navigate('offers')}
              className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <span>View Deals</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {featuredProducts.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} className="w-full" />
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. FRESHMART PROMISE STRIP
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-3xl bg-neutral-100/70 border border-neutral-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Clock size={20} />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-neutral-800">10-15 Min Express Delivery</h4>
            <p className="text-[11px] text-neutral-500">Instant doorstep delivery from local dark store</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 shadow-sm">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-neutral-800">100% Quality Inspected</h4>
            <p className="text-[11px] text-neutral-500">Direct sourcing, hygienic sorting and freshness sealed</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles size={20} className="fill-amber-500" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-neutral-800">Best Price Guarantee</h4>
            <p className="text-[11px] text-neutral-500">Direct mandi & brand discounts every day</p>
          </div>
        </div>
      </div>
    </div>
  );
}
