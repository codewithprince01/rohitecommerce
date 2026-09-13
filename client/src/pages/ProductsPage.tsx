import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Grid3X3,
  Filter,
  ChevronDown,
  Building2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getProductsByBrand, getBrandBySlug, getSubcategoryBySlug, getCategoryBySlug } from '../lib/data';
import type { ProductWithVariants, Brand, Subcategory, Category } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import SectionHeader from '../components/SectionHeader';

export default function ProductsPage() {
  const { state, navigate, setBrand, setSubcategory, setCategory } = useApp();
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [brand, setBrandState] = useState<Brand | null>(null);
  const [subcategory, setSubcategoryState] = useState<Subcategory | null>(null);
  const [category, setCategoryState] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'discount'>('popular');
  const [showSort, setShowSort] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!state.selectedBrandSlug) return;

      setLoading(true);
      try {
        const [brandData, productData] = await Promise.all([
          getBrandBySlug(state.selectedBrandSlug!),
          getProductsByBrand(state.selectedBrandSlug!),
        ]);

        setBrandState(brandData);
        setProducts(productData);

        if (brandData?.subcategory) {
          setSubcategoryState(brandData.subcategory as Subcategory);
          if (state.selectedCategorySlug) {
            const catData = await getCategoryBySlug(state.selectedCategorySlug!);
            setCategoryState(catData);
          }
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [state.selectedBrandSlug, state.selectedCategorySlug]);

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

  const handleBack = () => {
    if (state.selectedSubcategorySlug) {
      setSubcategory(state.selectedSubcategorySlug);
    }
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
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-[104px] z-40 bg-white px-4 py-3 flex items-center justify-between border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-neutral-700" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-neutral-800">{brand?.name || 'Products'}</h2>
            <p className="text-xs text-neutral-500">{products.length} products</p>
          </div>
        </div>
        <button
          onClick={() => setShowSort(s => !s)}
          className="flex items-center gap-1 bg-neutral-100 rounded-xl px-2.5 py-1.5"
        >
          <Filter size={12} className="text-neutral-600" />
          <span className="text-xs font-medium text-neutral-700">Sort</span>
          <ChevronDown size={12} className="text-neutral-500" />
        </button>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
          <button onClick={() => navigate('home')} className="hover:text-primary-600">Home</button>
          <ArrowRight size={12} />
          <button
            onClick={() => state.selectedCategorySlug && setCategory(state.selectedCategorySlug)}
            className="hover:text-primary-600 capitalize"
          >
            {category?.name}
          </button>
          <ArrowRight size={12} />
          <button
            onClick={() => state.selectedSubcategorySlug && setSubcategory(state.selectedSubcategorySlug)}
            className="hover:text-primary-600"
          >
            {subcategory?.name}
          </button>
          <ArrowRight size={12} />
          <span className="text-neutral-800 font-medium">{brand?.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {brand?.logo && (
              <div className="w-12 h-12 rounded-xl bg-neutral-50 overflow-hidden">
                <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-neutral-800">{brand?.name}</h2>
              <p className="text-sm text-neutral-500">{products.length} products available</p>
            </div>
          </div>
          <button
            onClick={() => setShowSort(s => !s)}
            className="flex items-center gap-2 bg-neutral-100 rounded-xl px-4 py-2.5 hover:bg-neutral-200 transition-colors relative"
          >
            <Filter size={16} className="text-neutral-600" />
            <span className="text-sm font-semibold text-neutral-700">Sort by</span>
            <ChevronDown size={14} className="text-neutral-500" />
          </button>
        </div>

        {/* Sort Dropdown - Desktop */}
        {showSort && (
          <div className="absolute right-6 top-[200px] w-56 bg-white rounded-2xl shadow-card-hover border border-neutral-100 overflow-hidden z-50">
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
                  sortBy === s.id ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sort Dropdown - Mobile */}
      {showSort && (
        <div className="lg:hidden mx-4 bg-white rounded-2xl shadow-card-hover border border-neutral-100 overflow-hidden mb-3 mt-1">
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

      {/* Products Grid */}
      <div className="px-4 lg:px-6 mt-3 lg:mt-6">
        <div className="max-w-7xl mx-auto">
          {sortedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center">
                <Grid3X3 size={32} className="text-neutral-300" />
              </div>
              <p className="text-neutral-500 text-sm font-medium">No products available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 lg:gap-4">
              {sortedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
