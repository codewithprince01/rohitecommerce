import { supabase } from './supabase';
import type { Category, Subcategory, Brand, ProductWithVariants } from './supabase';
import {
  mockCategories,
  mockSubcategories,
  mockBrands,
  mockProducts
} from './mockData';
import { allHomeZeptoProducts, findZeptoProductById } from '../data/homeZeptoData';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

const defaultCategoryImages: Record<string, string> = {
  'snacks-namkeen': 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=600',
  'snacks-and-namkeen': 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=600',
  'beverages': 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=600',
  'dairy': 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=600',
  'dairy-and-bakery': 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=600',
  'bakery': 'https://images.pexels.com/photos/1070946/pexels-photo-1070946.jpeg?auto=compress&cs=tinysrgb&w=600',
  'vegetables': 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=600',
  'fruits': 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=600',
  'staples': 'https://images.pexels.com/photos/4110257/pexels-photo-4110257.jpeg?auto=compress&cs=tinysrgb&w=600',
  'instant-food': 'https://images.pexels.com/photos/6054038/pexels-photo-6054038.jpeg?auto=compress&cs=tinysrgb&w=600',
  'personal-care': 'https://images.pexels.com/photos/3738833/pexels-photo-3738833.jpeg?auto=compress&cs=tinysrgb&w=600',
};

const defaultSubcategoryImages: Record<string, string> = {
  'chips': 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400',
  'chips-wafers': 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400',
  'namkeen': 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400',
  'biscuits': 'https://images.pexels.com/photos/1021821/pexels-photo-1021821.jpeg?auto=compress&cs=tinysrgb&w=400',
  'biscuits-cookies': 'https://images.pexels.com/photos/1021821/pexels-photo-1021821.jpeg?auto=compress&cs=tinysrgb&w=400',
  'juices': 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=400',
  'milk-and-curd': 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=400',
  'milk': 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=400',
  'paneer-cheese': 'https://images.pexels.com/photos/3738833/pexels-photo-3738833.jpeg?auto=compress&cs=tinysrgb&w=400',
  'soft-drinks': 'https://images.pexels.com/photos/1042423/pexels-photo-1042423.jpeg?auto=compress&cs=tinysrgb&w=400',
  'tea-coffee': 'https://images.pexels.com/photos/1454944/pexels-photo-1454944.jpeg?auto=compress&cs=tinysrgb&w=400',
  'noodles-pasta': 'https://images.pexels.com/photos/6054038/pexels-photo-6054038.jpeg?auto=compress&cs=tinysrgb&w=400',
  'bread': 'https://images.pexels.com/photos/1070946/pexels-photo-1070946.jpeg?auto=compress&cs=tinysrgb&w=400',
  'cakes-pastries': 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=400',
  'fresh-vegetables': 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=400',
  'fresh-fruits': 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=400',
};

export function getSubcategoryFallbackImage(slug: string, name = ''): string {
  const key = (slug || '').toLowerCase();
  if (defaultSubcategoryImages[key]) return defaultSubcategoryImages[key];
  for (const [k, url] of Object.entries(defaultSubcategoryImages)) {
    if (key.includes(k) || (name && name.toLowerCase().includes(k))) return url;
  }
  return 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400';
}

export function getProductFallbackImage(name: string, slug: string, tags?: string[]): string {
  const text = `${name || ''} ${slug || ''} ${(tags || []).join(' ')}`.toLowerCase();
  if (text.includes('juice') || text.includes('tropicana') || text.includes('real') || text.includes('apple') || text.includes('orange') || text.includes('fruit')) {
    return 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=400';
  }
  if (text.includes('milk') || text.includes('curd') || text.includes('dahi') || text.includes('butter') || text.includes('cheese') || text.includes('paneer') || text.includes('dairy')) {
    return 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=400';
  }
  if (text.includes('biscuit') || text.includes('cookie') || text.includes('parle') || text.includes('good day') || text.includes('marie') || text.includes('oreo')) {
    return 'https://images.pexels.com/photos/1021821/pexels-photo-1021821.jpeg?auto=compress&cs=tinysrgb&w=400';
  }
  if (text.includes('noodle') || text.includes('maggi') || text.includes('pasta') || text.includes('wai wai')) {
    return 'https://images.pexels.com/photos/6054038/pexels-photo-6054038.jpeg?auto=compress&cs=tinysrgb&w=400';
  }
  if (text.includes('coke') || text.includes('pepsi') || text.includes('sprite') || text.includes('drink') || text.includes('soda') || text.includes('thums')) {
    return 'https://images.pexels.com/photos/1042423/pexels-photo-1042423.jpeg?auto=compress&cs=tinysrgb&w=400';
  }
  if (text.includes('tea') || text.includes('chai') || text.includes('coffee') || text.includes('nescafe')) {
    return 'https://images.pexels.com/photos/1454944/pexels-photo-1454944.jpeg?auto=compress&cs=tinysrgb&w=400';
  }
  if (text.includes('bread') || text.includes('bakery') || text.includes('bun') || text.includes('toast')) {
    return 'https://images.pexels.com/photos/1070946/pexels-photo-1070946.jpeg?auto=compress&cs=tinysrgb&w=400';
  }
  if (text.includes('cake') || text.includes('pastry') || text.includes('muffin')) {
    return 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=400';
  }
  if (text.includes('vegetable') || text.includes('sabzi') || text.includes('onion') || text.includes('potato') || text.includes('tomato')) {
    return 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=400';
  }
  if (text.includes('namkeen') || text.includes('bhujia') || text.includes('sev') || text.includes('mixture') || text.includes('kuch')) {
    return 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400';
  }
  if (text.includes('chips') || text.includes('wafer') || text.includes('lays') || text.includes('pringles') || text.includes('kurkure')) {
    return 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400';
  }
  return 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400';
}

// Helper to log errors and signal fallback
function handleFetchError(operation: string, error: any) {
  console.warn(`Fetch failed during "${operation}". Falling back to mock data.`, error);
}

// Fetch all categories
export async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/categories?pageSize=100`);
    if (res.ok) {
      const json = await res.json();
      const rows = json?.data?.rows;
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id || r._id,
          name: r.name,
          slug: r.slug,
          image: r.image || defaultCategoryImages[r.slug] || defaultCategoryImages[r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')] || 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=600',
          bg_color: r.bg_color || 'bg-amber-100',
          sort_order: r.sort_order ?? 0,
          subcategory_count: r.subcategory_count,
          product_count: r.product_count,
          brand_count: r.brand_count,
          created_at: r.created_at || new Date().toISOString(),
        })).sort((a: Category, b: Category) => a.sort_order - b.sort_order);
      }
    }
  } catch (e) {
    // Backend offline, proceed to fallback
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    handleFetchError('getCategories', err);
  }

  return [...mockCategories].sort((a, b) => a.sort_order - b.sort_order);
}

// Fetch all subcategories in one request
export async function getAllSubcategories(): Promise<Subcategory[]> {
  try {
    const res = await fetch(`${API_BASE}/categories/sub/list?pageSize=200`);
    if (res.ok) {
      const json = await res.json();
      const rows = json?.data?.rows;
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id || r._id,
          category_id: r.category_id || r.category?.id,
          name: r.name,
          slug: r.slug,
          image: r.image || getSubcategoryFallbackImage(r.slug, r.name),
          sort_order: r.sort_order ?? 0,
          product_count: r.product_count,
          brand_count: r.brand_count,
          category: r.category ? {
            id: r.category.id,
            name: r.category.name,
            slug: r.category.slug,
          } : undefined,
          created_at: r.created_at || new Date().toISOString(),
        })).sort((a: Subcategory, b: Subcategory) => a.sort_order - b.sort_order);
      }
    }
  } catch (e) {}

  try {
    const { data, error } = await supabase
      .from('subcategories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((s: any) => ({
        ...s,
        image: s.image || getSubcategoryFallbackImage(s.slug, s.name),
      }));
    }
  } catch (err) {
    handleFetchError('getAllSubcategories', err);
  }

  return mockSubcategories.map(s => ({
    ...s,
    image: s.image || getSubcategoryFallbackImage(s.slug, s.name),
  })).sort((a, b) => a.sort_order - b.sort_order);
}

// Fetch subcategories by category slug
export async function getSubcategoriesByCategory(categorySlug: string): Promise<Subcategory[]> {
  try {
    const categories = await getCategories();
    const cat = categories.find(c => c.slug === categorySlug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === categorySlug);
    if (cat) {
      const res = await fetch(`${API_BASE}/categories/sub/list?pageSize=100&category_id=${cat.id}`);
      if (res.ok) {
        const json = await res.json();
        const rows = json?.data?.rows;
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id || r._id,
            category_id: cat.id,
            name: r.name,
            slug: r.slug,
            image: r.image || getSubcategoryFallbackImage(r.slug, r.name),
            sort_order: r.sort_order ?? 0,
            product_count: r.product_count,
            brand_count: r.brand_count,
            created_at: r.created_at || new Date().toISOString(),
          })).sort((a: Subcategory, b: Subcategory) => a.sort_order - b.sort_order);
        }
      }
    }
  } catch (e) {}

  try {
    const { data: categoryData, error: catError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (!catError && categoryData) {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryData.id)
        .order('sort_order', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    handleFetchError('getSubcategoriesByCategory', err);
  }

  const category = mockCategories.find(c => c.slug === categorySlug);
  if (!category) return [];
  return mockSubcategories
    .filter(s => s.category_id === category.id)
    .sort((a, b) => a.sort_order - b.sort_order);
}

// Fetch brands by subcategory slug
export async function getBrandsBySubcategory(subcategorySlug: string): Promise<Brand[]> {
  try {
    const subRes = await fetch(`${API_BASE}/categories/sub/list?pageSize=100&search=${encodeURIComponent(subcategorySlug)}`);
    if (subRes.ok) {
      const subJson = await subRes.json();
      const sub = subJson?.data?.rows?.find((s: any) => s.slug === subcategorySlug);
      if (sub) {
        const res = await fetch(`${API_BASE}/categories/brand/list?pageSize=100&subcategory_id=${sub.id || sub._id}`);
        if (res.ok) {
          const json = await res.json();
          const rows = json?.data?.rows;
          if (Array.isArray(rows) && rows.length > 0) {
            return rows.map((r: any) => ({
              id: r.id || r._id,
              subcategory_id: sub.id || sub._id,
              name: r.name,
              slug: r.slug,
              logo: r.logo || 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=100',
              description: r.description || null,
              created_at: r.created_at || new Date().toISOString(),
            }));
          }
        }
      }
    }
  } catch (e) {}

  try {
    const { data: subcategoryData, error: subError } = await supabase
      .from('subcategories')
      .select('id')
      .eq('slug', subcategorySlug)
      .single();

    if (!subError && subcategoryData) {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('subcategory_id', subcategoryData.id)
        .order('name', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    handleFetchError('getBrandsBySubcategory', err);
  }

  const subcat = mockSubcategories.find(s => s.slug === subcategorySlug);
  if (!subcat) return [];
  return mockBrands
    .filter(b => b.subcategory_id === subcat.id)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function mapProduct(p: any): ProductWithVariants {
  return {
    id: p.id || p._id,
    brand_id: p.brand_id,
    category_id: p.category_id,
    subcategory_id: p.subcategory_id,
    name: p.name,
    slug: p.slug,
    description: p.description || null,
    image: p.image || getProductFallbackImage(p.name, p.slug, p.tags),
    is_available: p.is_available ?? true,
    tags: p.tags || [],
    created_at: p.created_at || new Date().toISOString(),
    variants: (p.variants || []).map((v: any) => ({
      id: v.id || v._id,
      product_id: p.id || p._id,
      quantity: v.quantity,
      price: v.price,
      original_price: v.original_price,
      discount: v.discount ?? 0,
      stock: v.stock ?? 100,
      is_available: v.is_available ?? true,
      created_at: v.created_at || new Date().toISOString(),
    })),
    brand: p.brand ? {
      id: p.brand.id || p.brand._id,
      name: p.brand.name,
      slug: p.brand.slug || '',
      logo: p.brand.logo || null,
      description: p.brand.description || null,
      subcategory_id: p.brand.subcategory_id || '',
      created_at: p.brand.created_at || new Date().toISOString(),
    } : undefined,
    category: p.category ? {
      id: p.category.id || p.category._id,
      name: p.category.name,
      slug: p.category.slug || '',
      image: p.category.image || null,
      bg_color: p.category.bg_color || '',
      sort_order: p.category.sort_order || 0,
      created_at: p.category.created_at || new Date().toISOString(),
    } : undefined,
    subcategory: p.subcategory ? {
      id: p.subcategory.id || p.subcategory._id,
      category_id: p.category_id || (p.category ? (p.category.id || p.category._id) : ''),
      name: p.subcategory.name,
      slug: p.subcategory.slug || '',
      image: p.subcategory.image || null,
      sort_order: p.subcategory.sort_order || 0,
      created_at: p.subcategory.created_at || new Date().toISOString(),
    } : undefined,
  };
}

// Fetch products by brand with variants
export async function getProductsByBrand(brandSlug: string): Promise<ProductWithVariants[]> {
  try {
    const brandRes = await fetch(`${API_BASE}/categories/brand/list?pageSize=100&search=${encodeURIComponent(brandSlug)}`);
    if (brandRes.ok) {
      const bJson = await brandRes.json();
      const brand = bJson?.data?.rows?.find((b: any) => b.slug === brandSlug);
      if (brand) {
        const pRes = await fetch(`${API_BASE}/products?pageSize=100&brand_id=${brand.id || brand._id}`);
        if (pRes.ok) {
          const pJson = await pRes.json();
          const rows = pJson?.data?.rows;
          if (Array.isArray(rows) && rows.length > 0) {
            return rows.map(mapProduct);
          }
        }
      }
    }
  } catch (e) {}

  try {
    const { data: brandData, error: brandError } = await supabase
      .from('brands')
      .select('id')
      .eq('slug', brandSlug)
      .single();

    if (!brandError && brandData) {
      const { data, error } = await supabase
        .from('products')
        .select(`*, variants:product_variants (*)`)
        .eq('brand_id', brandData.id)
        .order('name', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) return data as ProductWithVariants[];
    }
  } catch (err) {
    handleFetchError('getProductsByBrand', err);
  }

  const brand = mockBrands.find(b => b.slug === brandSlug);
  if (!brand) return [];
  return mockProducts
    .filter(p => p.brand_id === brand.id)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Fetch products by category with variants
export async function getProductsByCategory(categorySlug: string): Promise<ProductWithVariants[]> {
  try {
    const categories = await getCategories();
    const cat = categories.find(c => c.slug === categorySlug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === categorySlug);
    if (cat) {
      const res = await fetch(`${API_BASE}/products?pageSize=100&category_id=${cat.id}`);
      if (res.ok) {
        const json = await res.json();
        const rows = json?.data?.rows;
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map(mapProduct);
        }
      }
    }
  } catch (e) {}

  try {
    const { data: categoryData, error: catError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (!catError && categoryData) {
      const { data, error } = await supabase
        .from('products')
        .select(`*, variants:product_variants (*)`)
        .eq('category_id', categoryData.id)
        .order('name', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) return data as ProductWithVariants[];
    }
  } catch (err) {
    handleFetchError('getProductsByCategory', err);
  }

  const category = mockCategories.find(c => c.slug === categorySlug);
  if (!category) return [];
  return mockProducts
    .filter(p => p.category_id === category.id)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Fetch products by subcategory with variants
export async function getProductsBySubcategory(subcategorySlug: string): Promise<ProductWithVariants[]> {
  try {
    const subRes = await fetch(`${API_BASE}/categories/sub/list?pageSize=100&search=${encodeURIComponent(subcategorySlug)}`);
    if (subRes.ok) {
      const subJson = await subRes.json();
      const sub = subJson?.data?.rows?.find((s: any) => s.slug === subcategorySlug);
      if (sub) {
        const res = await fetch(`${API_BASE}/products?pageSize=100&subcategory_id=${sub.id || sub._id}`);
        if (res.ok) {
          const json = await res.json();
          const rows = json?.data?.rows;
          if (Array.isArray(rows) && rows.length > 0) {
            return rows.map(mapProduct);
          }
        }
      }
    }
  } catch (e) {}

  try {
    const { data: subcategoryData, error: subError } = await supabase
      .from('subcategories')
      .select('id')
      .eq('slug', subcategorySlug)
      .single();

    if (!subError && subcategoryData) {
      const { data, error } = await supabase
        .from('products')
        .select(`*, variants:product_variants (*)`)
        .eq('subcategory_id', subcategoryData.id)
        .order('name', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) return data as ProductWithVariants[];
    }
  } catch (err) {
    handleFetchError('getProductsBySubcategory', err);
  }

  const subcat = mockSubcategories.find(s => s.slug === subcategorySlug);
  if (!subcat) return [];
  return mockProducts
    .filter(p => p.subcategory_id === subcat.id)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Fetch single product with all variants
export async function getProductBySlug(slug: string): Promise<ProductWithVariants | null> {
  const zepto = findZeptoProductById(slug);
  if (zepto) return zepto;

  try {
    const res = await fetch(`${API_BASE}/products?pageSize=10&search=${encodeURIComponent(slug)}`);
    if (res.ok) {
      const json = await res.json();
      const p = json?.data?.rows?.find((prod: any) => prod.slug === slug);
      if (p) return mapProduct(p);
    }
  } catch (e) {}

  try {
    const { data, error } = await supabase
      .from('products')
      .select(`*, variants:product_variants (*)`)
      .eq('slug', slug)
      .single();

    if (!error && data) return data as ProductWithVariants;
  } catch (err) {
    handleFetchError('getProductBySlug', err);
  }

  return mockProducts.find(p => p.slug === slug) || null;
}

// Fetch product by ID with all variants
export async function getProductById(id: string): Promise<ProductWithVariants | null> {
  const zepto = findZeptoProductById(id);
  if (zepto) return zepto;

  try {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (res.ok) {
      const json = await res.json();
      if (json?.success && json?.data) {
        return mapProduct(json.data);
      }
    }
  } catch (e) {}

  try {
    const { data, error } = await supabase
      .from('products')
      .select(`*, variants:product_variants (*), brand:brands (id, name, slug, logo, description)`)
      .eq('id', id)
      .single();

    if (!error && data) return data as ProductWithVariants;
  } catch (err) {
    handleFetchError('getProductById', err);
  }

  const product = mockProducts.find(p => p.id === id || p.slug === id);
  if (!product) return null;
  const brand = mockBrands.find(b => b.id === product.brand_id);
  return {
    ...product,
    brand: brand ? {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo,
      description: brand.description,
      subcategory_id: brand.subcategory_id,
      created_at: brand.created_at,
    } : undefined,
  };
}

// Search products
export async function searchProducts(query: string): Promise<ProductWithVariants[]> {
  try {
    const res = await fetch(`${API_BASE}/products?pageSize=20&search=${encodeURIComponent(query)}`);
    if (res.ok) {
      const json = await res.json();
      const rows = json?.data?.rows;
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map(mapProduct);
      }
    }
  } catch (e) {}

  try {
    const { data, error } = await supabase
      .from('products')
      .select(`*, variants:product_variants (*)`)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(20);

    if (!error && Array.isArray(data) && data.length > 0) return data as ProductWithVariants[];
  } catch (err) {
    handleFetchError('searchProducts', err);
  }

  const lowerQuery = query.toLowerCase();
  return mockProducts
    .filter(p => p.name.toLowerCase().includes(lowerQuery) || (p.description && p.description.toLowerCase().includes(lowerQuery)))
    .slice(0, 20);
}

// Fetch featured/popular products
export async function getFeaturedProducts(): Promise<ProductWithVariants[]> {
  try {
    const res = await fetch(`${API_BASE}/products?pageSize=12`);
    if (res.ok) {
      const json = await res.json();
      const rows = json?.data?.rows;
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map(mapProduct);
      }
    }
  } catch (e) {}

  try {
    const { data, error } = await supabase
      .from('products')
      .select(`*, variants:product_variants (*)`)
      .limit(12);

    if (!error && Array.isArray(data) && data.length > 0) return data as ProductWithVariants[];
  } catch (err) {
    handleFetchError('getFeaturedProducts', err);
  }

  return mockProducts.slice(0, 12);
}

// Get category by slug
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find(c => c.slug === slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug) || null;
}

// Get subcategory by slug
export async function getSubcategoryBySlug(slug: string): Promise<Subcategory | null> {
  try {
    const res = await fetch(`${API_BASE}/categories/sub/list?pageSize=100&search=${encodeURIComponent(slug)}`);
    if (res.ok) {
      const json = await res.json();
      const row = json?.data?.rows?.find((s: any) => s.slug === slug);
      if (row) {
        return {
          id: row.id || row._id,
          category_id: row.category_id,
          name: row.name,
          slug: row.slug,
          image: row.image || 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=200',
          sort_order: row.sort_order ?? 0,
          created_at: row.created_at || new Date().toISOString(),
          category: row.category,
        };
      }
    }
  } catch (e) {}

  const subcat = mockSubcategories.find(s => s.slug === slug);
  if (!subcat) return null;
  const category = mockCategories.find(c => c.id === subcat.category_id);
  return { ...subcat, category };
}

// Get brand by slug
export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  try {
    const res = await fetch(`${API_BASE}/categories/brand/list?pageSize=100&search=${encodeURIComponent(slug)}`);
    if (res.ok) {
      const json = await res.json();
      const row = json?.data?.rows?.find((b: any) => b.slug === slug);
      if (row) {
        return {
          id: row.id || row._id,
          subcategory_id: row.subcategory_id,
          name: row.name,
          slug: row.slug,
          logo: row.logo || 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=100',
          description: row.description || null,
          created_at: row.created_at || new Date().toISOString(),
        };
      }
    }
  } catch (e) {}

  const brand = mockBrands.find(b => b.slug === slug);
  if (!brand) return null;
  const subcategory = mockSubcategories.find(s => s.id === brand.subcategory_id);
  return { ...brand, subcategory };
}

// Get all products
export async function getAllProducts(): Promise<ProductWithVariants[]> {
  let apiProducts: ProductWithVariants[] = [];
  try {
    const res = await fetch(`${API_BASE}/products?pageSize=200`);
    if (res.ok) {
      const json = await res.json();
      const rows = json?.data?.rows;
      if (Array.isArray(rows) && rows.length > 0) {
        apiProducts = rows.map(mapProduct);
      }
    }
  } catch (e) {}

  if (apiProducts.length === 0) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`*, variants:product_variants (*)`);

      if (!error && Array.isArray(data) && data.length > 0) {
        apiProducts = data as ProductWithVariants[];
      }
    } catch (err) {
      handleFetchError('getAllProducts', err);
    }
  }

  // Combine api products, mock products, and home zepto products deduplicated by ID / slug
  const seen = new Set<string>();
  const allList: ProductWithVariants[] = [];

  for (const p of [...apiProducts, ...mockProducts, ...allHomeZeptoProducts]) {
    const key = p.id || p.slug;
    if (key && !seen.has(key)) {
      seen.add(key);
      if (p.slug) seen.add(p.slug);
      allList.push(p);
    }
  }

  return allList;
}

export interface PublicHomeSection {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  category?: { _id: string; name: string; slug: string; image?: string };
  products: ProductWithVariants[];
  sort_order: number;
}

export interface PublicOfferDeal {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  discount_label?: string;
  bg_gradient?: string;
  products: ProductWithVariants[];
  sort_order: number;
}

export async function getPublicHomeSections(): Promise<PublicHomeSection[]> {
  try {
    const res = await fetch(`${API_BASE}/home-sections/public`);
    if (res.ok) {
      const json = await res.json();
      const rows = json?.data;
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((s: any) => ({
          ...s,
          products: (s.products || []).map(mapProduct),
        }));
      }
    }
  } catch (err) {
    console.warn('Failed to fetch public home sections:', err);
  }
  return [];
}

export async function getPublicOfferDeals(): Promise<PublicOfferDeal[]> {
  try {
    const res = await fetch(`${API_BASE}/offer-deals/public`);
    if (res.ok) {
      const json = await res.json();
      const rows = json?.data;
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((d: any) => ({
          ...d,
          products: (d.products || []).map(mapProduct),
        }));
      }
    }
  } catch (err) {
    console.warn('Failed to fetch public offer deals:', err);
  }
  return [];
}

