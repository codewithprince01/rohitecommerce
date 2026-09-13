import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Star,
  Heart,
  Share2,
  ShoppingCart,
  Plus,
  Minus,
  ChevronRight,
  Truck,
  ShieldCheck,
  Clock,
  Info,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getProductById, getCategoryBySlug, getSubcategoryBySlug } from '../lib/data';
import type { ProductWithVariants, ProductVariant, Category, Subcategory } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import SectionHeader from '../components/SectionHeader';

export default function ProductDetailPage() {
  const {
    state,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    cart,
    navigate,
    openProduct,
    setBrand,
    setSubcategory,
    setCategory,
    toggleWishlist,
    isInWishlist,
  } = useApp();
  const [product, setProduct] = useState<ProductWithVariants | null>(null);
  const [category, setCategoryState] = useState<Category | null>(null);
  const [subcategory, setSubcategoryState] = useState<Subcategory | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);

  const isWishlisted = product ? isInWishlist(product.id) : false;

  useEffect(() => {
    async function fetchProduct() {
      if (!state.selectedProductId) return;

      setLoading(true);
      try {
        const data = await getProductById(state.selectedProductId!);
        setProduct(data);
        if (data?.variants?.length) {
          setSelectedVariant(data.variants[0]);
        }

        // Fetch category and subcategory details for breadcrumbs
        if (state.selectedCategorySlug) {
          const catData = await getCategoryBySlug(state.selectedCategorySlug);
          setCategoryState(catData);
        }
        if (state.selectedSubcategorySlug) {
          const subData = await getSubcategoryBySlug(state.selectedSubcategorySlug);
          setSubcategoryState(subData);
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [state.selectedProductId, state.selectedCategorySlug, state.selectedSubcategorySlug]);

  // Find cart item for selected variant
  const cartItem = cart.find(i => i.product.id === state.selectedProductId && i.variant.id === selectedVariant?.id);
  const qty = cartItem?.quantity || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-neutral-500">Product not found</p>
        <button
          onClick={() => navigate('home')}
          className="bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const savings = selectedVariant ? selectedVariant.original_price - selectedVariant.price : 0;

  return (
    <div className="pb-28 lg:pb-8">
      {/* Back header - Mobile */}
      <div className="lg:hidden sticky top-[104px] z-40 bg-white px-4 py-3 flex items-center justify-between border-b border-neutral-100">
        <button
          onClick={() =>
            state.selectedBrandSlug
              ? openProduct(null)
              : navigate('home')
          }
          className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-neutral-700" />
        </button>
        <span className="text-sm font-semibold text-neutral-800">Product Details</span>
        <div className="flex gap-2">
          <button
            onClick={() => product && toggleWishlist(product.id)}
            title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center transition-colors"
          >
            <Heart
              size={18}
              className={isWishlisted ? 'text-rose-500 fill-rose-500' : 'text-neutral-600'}
            />
          </button>
          <button className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center">
            <Share2 size={18} className="text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 py-4">
        <nav className="flex items-center gap-2 text-sm text-neutral-500">
          <button onClick={() => navigate('home')} className="hover:text-primary-600 transition-colors">Home</button>
          {category && (
            <>
              <ChevronRight size={14} />
              <button
                onClick={() => setCategory(category.slug)}
                className="hover:text-primary-600 transition-colors capitalize"
              >
                {category.name}
              </button>
            </>
          )}
          {subcategory && (
            <>
              <ChevronRight size={14} />
              <button
                onClick={() => setSubcategory(subcategory.slug)}
                className="hover:text-primary-600 transition-colors"
              >
                {subcategory.name}
              </button>
            </>
          )}
          {product.brand && (
            <>
              <ChevronRight size={14} />
              <button
                onClick={() => state.selectedBrandSlug && setBrand(state.selectedBrandSlug)}
                className="hover:text-primary-600 transition-colors"
              >
                {product.brand.name}
              </button>
            </>
          )}
          <ChevronRight size={14} />
          <span className="text-neutral-800 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:px-6">
          {/* Product Image */}
          <div className="relative bg-neutral-50 rounded-none lg:rounded-2xl overflow-hidden">
            <img
              src={product.image || 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400'}
              alt={product.name}
              className="w-full h-64 lg:h-[500px] object-cover"
            />
            {selectedVariant && selectedVariant.discount > 0 && (
              <span className="absolute top-4 left-4 bg-primary-500 text-white text-sm font-bold px-3 py-1.5 rounded-xl">
                {selectedVariant.discount}% OFF
              </span>
            )}
            {product.tags && product.tags[0] && (
              <span className="absolute top-4 right-4 bg-accent-500 text-white text-xs font-bold px-2.5 py-1 rounded-xl">
                {product.tags[0]}
              </span>
            )}
            {/* Desktop action buttons */}
            <div className="hidden lg:flex absolute bottom-4 right-4 gap-2">
              <button
                onClick={() => product && toggleWishlist(product.id)}
                title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                className="w-12 h-12 rounded-xl bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-colors"
              >
                <Heart
                  size={22}
                  className={isWishlisted ? 'text-rose-500 fill-rose-500' : 'text-neutral-600'}
                />
              </button>
              <button className="w-12 h-12 rounded-xl bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-colors">
                <Share2 size={22} className="text-neutral-600" />
              </button>
            </div>
          </div>

          {/* Product Details */}
          <div className="px-4 lg:px-0 lg:py-4">
            {/* Mobile Info */}
            <div className="lg:hidden pt-4">
              <div className="mb-4">
                {product.brand && (
                  <p className="text-xs text-primary-600 font-semibold mb-1">{product.brand.name}</p>
                )}
                <h1 className="text-xl font-bold text-neutral-800 leading-tight">{product.name}</h1>
              </div>

              {/* Quantity/Variant Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-neutral-600 font-medium mb-2">Select Quantity</p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                          selectedVariant?.id === v.id
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-primary-400'
                        }`}
                      >
                        {v.quantity} - Rs {v.price}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-baseline gap-3">
                {selectedVariant && (
                  <>
                    <span className="text-2xl font-bold text-neutral-800">Rs {selectedVariant.price}</span>
                    {selectedVariant.original_price > selectedVariant.price && (
                      <>
                        <span className="text-base text-neutral-400 line-through">Rs {selectedVariant.original_price}</span>
                        <span className="text-sm font-semibold text-primary-600">Save Rs {savings}</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Desktop Info */}
            <div className="hidden lg:block mb-6">
              {product.brand && (
                <p className="text-sm text-primary-600 font-semibold mb-2">{product.brand.name}</p>
              )}
              <h1 className="text-3xl font-bold text-neutral-800 leading-tight">{product.name}</h1>

              {/* Quantity/Variant Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-neutral-700 font-medium mb-3">Select Quantity</p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all flex flex-col items-center min-w-[80px] ${
                          selectedVariant?.id === v.id
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-primary-400'
                        }`}
                      >
                        <span>{v.quantity}</span>
                        <span className={`text-xs ${selectedVariant?.id === v.id ? 'text-white/80' : 'text-neutral-500'}`}>
                          Rs {v.price}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-baseline gap-4 mt-4">
                {selectedVariant && (
                  <>
                    <span className="text-3xl font-bold text-neutral-800">Rs {selectedVariant.price}</span>
                    {selectedVariant.original_price > selectedVariant.price && (
                      <>
                        <span className="text-xl text-neutral-400 line-through">Rs {selectedVariant.original_price}</span>
                        <span className="text-sm font-semibold text-primary-600 px-2 py-1 bg-primary-50 rounded-lg">
                          Save Rs {savings}
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="grid grid-cols-3 gap-2 lg:gap-3 mb-4 lg:mb-6">
              {[
                { icon: Truck, label: 'Free Delivery', sub: 'Above Rs 299' },
                { icon: Clock, label: '10-15 Min', sub: 'Fast Delivery' },
                { icon: ShieldCheck, label: 'Quality', sub: 'Assured' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="bg-neutral-50 rounded-xl p-2.5 lg:p-3 flex flex-col items-center gap-1 text-center hover:bg-neutral-100 transition-colors">
                  <Icon size={18} className="text-primary-600 lg:w-5 lg:h-5" />
                  <span className="text-xs lg:text-sm font-semibold text-neutral-700">{label}</span>
                  <span className="text-[10px] lg:text-xs text-neutral-500">{sub}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="mb-4 lg:mb-6">
              <div className="flex items-center gap-1.5 mb-2">
                <Info size={14} className="text-neutral-500" />
                <h3 className="text-sm font-semibold text-neutral-700">Product Description</h3>
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {product.description || 'No description available.'}
              </p>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5 lg:mb-6">
                {product.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-xs bg-primary-50 text-primary-700 font-medium px-2.5 py-1 rounded-full border border-primary-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Desktop Add to Cart */}
            <div className="hidden lg:block">
              <div className="flex items-center gap-4">
                {selectedVariant && (
                  qty === 0 ? (
                    <button
                      onClick={() => addToCart(product, selectedVariant)}
                      className="flex-1 bg-primary-500 text-white font-semibold text-base py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors disabled:opacity-50"
                      disabled={selectedVariant.stock <= 0}
                    >
                      <ShoppingCart size={20} />
                      {selectedVariant.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 bg-primary-500 rounded-2xl px-5 py-3 flex-1 justify-between">
                      <button
                        onClick={() => {
                          if (qty <= 1) {
                            removeFromCart(product.id, selectedVariant.id);
                          } else {
                            updateCartQuantity(product.id, selectedVariant.id, qty - 1);
                          }
                        }}
                        className="p-1"
                      >
                        <Minus size={20} className="text-white" />
                      </button>
                      <span className="text-white font-bold text-lg">{qty}</span>
                      <button onClick={() => addToCart(product, selectedVariant)} className="p-1">
                        <Plus size={20} className="text-white" />
                      </button>
                    </div>
                  )
                )}
                <button
                  onClick={() => setWishlist(w => !w)}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                    wishlist ? 'bg-rose-50' : 'bg-neutral-100'
                  }`}
                >
                  <Heart
                    size={24}
                    className={wishlist ? 'text-rose-500 fill-rose-500' : 'text-neutral-500'}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Add to Cart - Mobile */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 px-4 z-40">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-card-hover p-3 flex items-center justify-between gap-3 border border-neutral-100">
            <div>
              {selectedVariant && (
                <>
                  <span className="text-lg font-bold text-neutral-800">Rs {selectedVariant.price}</span>
                  {selectedVariant.original_price > selectedVariant.price && (
                    <span className="text-xs text-neutral-400 line-through ml-1.5">Rs {selectedVariant.original_price}</span>
                  )}
                </>
              )}
            </div>
            {selectedVariant && (
              qty === 0 ? (
                <button
                  onClick={() => addToCart(product, selectedVariant)}
                  className="flex-1 bg-primary-500 text-white font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                  disabled={selectedVariant.stock <= 0}
                >
                  <ShoppingCart size={16} />
                  {selectedVariant.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              ) : (
                <div className="flex items-center gap-4 bg-primary-500 rounded-xl px-5 py-3">
                  <button
                    onClick={() => {
                      if (qty <= 1) {
                        removeFromCart(product.id, selectedVariant.id);
                      } else {
                        updateCartQuantity(product.id, selectedVariant.id, qty - 1);
                      }
                    }}
                  >
                    <Minus size={16} className="text-white" />
                  </button>
                  <span className="text-white font-bold text-sm min-w-[20px] text-center">{qty}</span>
                  <button onClick={() => addToCart(product, selectedVariant)}>
                    <Plus size={16} className="text-white" />
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
