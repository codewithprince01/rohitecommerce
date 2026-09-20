import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { searchProducts } from '../lib/data';
import type { ProductWithVariants } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import { Search, ShoppingBag } from 'lucide-react';

export default function SearchPage() {
  const { state, setSearch } = useApp();
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(false);
  const searchQuery = state.searchQuery;

  useEffect(() => {
    async function performSearch() {
      if (!searchQuery || searchQuery.length < 2) {
        setProducts([]);
        return;
      }

      setLoading(true);
      try {
        const data = await searchProducts(searchQuery);
        setProducts(data);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  return (
    <div className="px-4 lg:px-6 py-4 lg:py-6">
      <div className="max-w-7xl mx-auto">
        {/* Search Input */}
        <div className="mb-6">
          <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-card border border-neutral-200">
            <Search size={18} className="text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, brands..."
              className="flex-1 bg-transparent text-sm text-neutral-700 placeholder-neutral-400 outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-primary-600 font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : searchQuery && searchQuery.length >= 2 ? (
          <>
            <p className="text-sm text-neutral-500 mb-4">
              {products.length} results for "{searchQuery}"
            </p>
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center">
                  <ShoppingBag size={36} className="text-neutral-300" />
                </div>
                <p className="text-neutral-500 text-base font-medium">No products found</p>
                <p className="text-neutral-400 text-sm">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-4">
                {products.map(p => (
                  <ProductCard key={p.id} product={p} className="w-full" />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center">
              <Search size={36} className="text-neutral-300" />
            </div>
            <p className="text-neutral-500 text-base font-medium">Search for products</p>
            <p className="text-neutral-400 text-sm">Type at least 2 characters to search</p>
          </div>
        )}
      </div>
    </div>
  );
}
