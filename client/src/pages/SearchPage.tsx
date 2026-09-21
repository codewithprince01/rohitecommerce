import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { searchCatalog, getCategories, type CatalogSearchResults } from '../lib/data';
import type { Category } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import SafeImage from '../components/SafeImage';
import { Search, ShoppingBag, ChevronRight, Layers, FolderTree, Tag } from 'lucide-react';

const EMPTY: CatalogSearchResults = {
  products: [],
  categories: [],
  subcategories: [],
  brands: [],
  total: 0,
};

export default function SearchPage() {
  const { state, setSearch, setCategory, setSubcategory, setBrand } = useApp();
  const [results, setResults] = useState<CatalogSearchResults>(EMPTY);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const searchQuery = state.searchQuery;

  // A brand only knows its parent subcategory's category_id, but the storefront
  // routes are built from slugs — this closes that last gap.
  const categorySlugById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of allCategories) map.set(c.id, c.slug);
    return map;
  }, [allCategories]);

  useEffect(() => {
    getCategories().then(setAllCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    async function performSearch() {
      if (!searchQuery || searchQuery.length < 2) {
        setResults(EMPTY);
        return;
      }

      setLoading(true);
      try {
        setResults(await searchCatalog(searchQuery));
      } catch (err) {
        console.error('Search failed:', err);
        setResults(EMPTY);
      } finally {
        setLoading(false);
      }
    }

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const openCategory = (slug: string) => {
    setCategory(slug);
  };

  const openSubcategory = (categorySlug: string | undefined, slug: string) => {
    setCategory(categorySlug ?? null);
    setSubcategory(slug);
  };

  const openBrand = (categorySlug: string | undefined, subSlug: string | undefined, slug: string) => {
    setCategory(categorySlug ?? null);
    setSubcategory(subSlug ?? null);
    setBrand(slug);
  };

  const hasQuery = Boolean(searchQuery && searchQuery.length >= 2);
  const { products, categories, subcategories, brands, total } = results;

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
              placeholder="Search products, categories, brands…"
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

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : hasQuery ? (
          <>
            <p className="text-sm text-neutral-500 mb-4">
              {total} result{total === 1 ? '' : 's'} for "{searchQuery}"
            </p>

            {total === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center">
                  <ShoppingBag size={36} className="text-neutral-300" />
                </div>
                <p className="text-neutral-500 text-base font-medium">Nothing matched that</p>
                <p className="text-neutral-400 text-sm">Try a different word, or a shorter one</p>
              </div>
            ) : (
              <div className="space-y-6">
                {categories.length > 0 && (
                  <ResultSection title="Categories" icon={Layers} count={categories.length}>
                    {categories.map((c) => (
                      <ResultRow
                        key={c.id}
                        image={c.image}
                        name={c.name}
                        meta={countLine([
                          [c.subcategory_count, 'subcategory', 'subcategories'],
                          [c.product_count, 'product', 'products'],
                        ])}
                        onClick={() => openCategory(c.slug)}
                      />
                    ))}
                  </ResultSection>
                )}

                {subcategories.length > 0 && (
                  <ResultSection title="Subcategories" icon={FolderTree} count={subcategories.length}>
                    {subcategories.map((s) => (
                      <ResultRow
                        key={s.id}
                        image={s.image}
                        name={s.name}
                        meta={[
                          s.category?.name ? `in ${s.category.name}` : '',
                          countLine([
                            [s.brand_count, 'sub-sub category', 'sub-sub categories'],
                            [s.product_count, 'product', 'products'],
                          ]),
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                        onClick={() => openSubcategory(s.category?.slug, s.slug)}
                      />
                    ))}
                  </ResultSection>
                )}

                {brands.length > 0 && (
                  <ResultSection title="Sub-sub categories" icon={Tag} count={brands.length}>
                    {brands.map((b) => {
                      const sub = b.subcategory;
                      const categorySlug = sub?.category_id
                        ? categorySlugById.get(sub.category_id)
                        : undefined;
                      return (
                        <ResultRow
                          key={b.id}
                          image={b.logo}
                          name={b.name}
                          meta={sub?.name ? `in ${sub.name}` : ''}
                          onClick={() => openBrand(categorySlug, sub?.slug, b.slug)}
                        />
                      );
                    })}
                  </ResultSection>
                )}

                {products.length > 0 && (
                  <div>
                    <SectionHeading title="Products" icon={ShoppingBag} count={products.length} />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-4">
                      {products.map((p) => (
                        <ProductCard key={p.id} product={p} className="w-full" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center">
              <Search size={36} className="text-neutral-300" />
            </div>
            <p className="text-neutral-500 text-base font-medium">Search the whole store</p>
            <p className="text-neutral-400 text-sm">
              Products, categories, subcategories and brands — type at least 2 characters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Pieces --------------------------------- */

/** "3 subcategories · 12 products", skipping anything the API did not count. */
function countLine(parts: [number | undefined, string, string][]): string {
  return parts
    .filter(([n]) => typeof n === 'number')
    .map(([n, one, many]) => `${n} ${n === 1 ? one : many}`)
    .join(' · ');
}

function SectionHeading({
  title,
  icon: Icon,
  count,
}: {
  title: string;
  icon: typeof Layers;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <Icon size={15} className="text-neutral-400" />
      <h2 className="text-sm font-bold text-neutral-800">{title}</h2>
      <span className="text-[11px] font-semibold text-neutral-400">({count})</span>
    </div>
  );
}

function ResultSection({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: typeof Layers;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <SectionHeading title={title} icon={icon} count={count} />
      <div className="bg-white rounded-2xl border border-neutral-200/80 divide-y divide-neutral-100 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function ResultRow({
  image,
  name,
  meta,
  onClick,
}: {
  image?: string | null;
  name: string;
  meta?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-50 transition-colors"
    >
      <SafeImage
        src={image}
        alt={name}
        iconSize={16}
        className="w-10 h-10 rounded-xl object-cover bg-neutral-100 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-800 truncate">{name}</p>
        {meta && <p className="text-[11px] text-neutral-400 truncate">{meta}</p>}
      </div>
      <ChevronRight size={16} className="text-neutral-300 shrink-0" />
    </button>
  );
}
