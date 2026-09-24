import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  Share2,
  ShoppingCart,
  Plus,
  Minus,
  ChevronRight,
  Truck,
  Info,
  Check,
  Leaf,
  Banknote,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import SafeImage from '../components/SafeImage';
import {
  getProductById,
  getCategories,
  getAllSubcategories,
  getProductsBySubcategory,
} from '../lib/data';
import type { ProductWithVariants, ProductVariant, Category, Subcategory } from '../lib/supabase';
import { variantPricing } from '../lib/pricing';
import ZeptoProductCard from '../components/ZeptoProductCard';
import PackPicker from '../components/PackPicker';

export default function ProductDetailPage() {
  const {
    state,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    cart,
    navigate,
    setSubcategory,
    setCategory,
    toggleWishlist,
    removeFromWishlist,
    isInWishlist,
    deliveryLocation,
  } = useApp();

  const [product, setProduct] = useState<ProductWithVariants | null>(null);
  const [category, setCategoryState] = useState<Category | null>(null);
  const [subcategory, setSubcategoryState] = useState<Subcategory | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const isWishlisted = product
    ? isInWishlist(product.id) || (Boolean(product.slug) && isInWishlist(product.slug))
    : false;

  const handleToggleWishlist = () => {
    if (!product) return;
    if (isWishlisted) {
      removeFromWishlist(product.id);
      if (product.slug) removeFromWishlist(product.slug);
    } else {
      toggleWishlist(product.id);
    }
  };

  useEffect(() => {
    async function fetchProduct() {
      if (!state.selectedProductId) return;

      setLoading(true);
      try {
        const data = await getProductById(state.selectedProductId);
        setProduct(data);
        if (data?.variants?.length) {
          setSelectedVariant(data.variants[0]);
        }

        // Fetch full categories and subcategories
        const [allCats, allSubs] = await Promise.all([
          getCategories(),
          getAllSubcategories(),
        ]);

        const catId = data?.category_id;
        const subId = data?.subcategory_id;
        const catSlug = state.selectedCategorySlug;
        const subSlug = state.selectedSubcategorySlug;

        const foundCat = data?.category || allCats.find(
          (c) => (catSlug && c.slug === catSlug) || (catId && (c.id === catId || (c as any)._id === catId))
        );
        const foundSub = data?.subcategory || allSubs.find(
          (s) => (subSlug && s.slug === subSlug) || (subId && (s.id === subId || (s as any)._id === subId))
        );

        if (foundCat) setCategoryState(foundCat);
        if (foundSub) {
          setSubcategoryState(foundSub);
          const related = await getProductsBySubcategory(foundSub.slug);
          setRelatedProducts(
            related.filter((p) => p.id !== data?.id && p.slug !== data?.slug).slice(0, 5)
          );
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
  const cartItem = cart.find(
    (i) => i.product.id === state.selectedProductId && i.variant.id === selectedVariant?.id
  );
  const qty = cartItem?.quantity || 0;

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else if (subcategory) {
      setSubcategory(subcategory.slug);
    } else {
      navigate('home');
    }
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on Agrawal General & Provisional Store!`,
          url: window.location.href,
        });
      } catch (e) {}
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
          <Info size={24} />
        </div>
        <p className="text-neutral-700 font-bold text-sm">Product not found</p>
        <button
          onClick={handleBack}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-xs"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Same rule as the product cards, so a pack never advertises a discount here
  // that the card does not show (or the other way round).
  const pricing = variantPricing(selectedVariant);
  const savings = pricing.savings;
  const currentPrice = pricing.price;
  const currentOriginalPrice = pricing.originalPrice;
  const currentWeight = selectedVariant?.quantity || '1 pack';

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 lg:pb-12">
      {/* ========================================================= */}
      {/* MOBILE TOP BAR (Compact, sticky top-0) */}
      {/* ========================================================= */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-neutral-100 px-3 py-2 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={handleBack}
            className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 active:scale-95 transition-all flex-shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft size={15} />
          </button>
          <span className="text-xs font-bold text-neutral-800 truncate max-w-[190px]">
            {product.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleToggleWishlist}
            title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center active:scale-95 transition-all"
          >
            <Heart
              size={14}
              className={isWishlisted ? 'text-rose-500 fill-rose-500' : 'text-neutral-600'}
            />
          </button>
          <button
            onClick={handleShare}
            title="Share product"
            className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 active:scale-95 transition-all relative"
          >
            <Share2 size={14} />
            {copied && (
              <span className="absolute -bottom-7 right-0 bg-neutral-900 text-white text-[9.5px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap">
                Copied!
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DESKTOP BREADCRUMBS & COMPACT TOP NAV */}
      {/* ========================================================= */}
      <div className="hidden lg:block max-w-4xl mx-auto px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
            <button
              onClick={() => navigate('home')}
              className="hover:text-emerald-700 transition-colors"
            >
              Home
            </button>
            {category && (
              <>
                <ChevronRight size={10} className="text-neutral-400" />
                <button
                  onClick={() => setCategory(category.slug)}
                  className="hover:text-emerald-700 transition-colors capitalize"
                >
                  {category.name}
                </button>
              </>
            )}
            {subcategory && (
              <>
                <ChevronRight size={10} className="text-neutral-400" />
                <button
                  onClick={() => setSubcategory(subcategory.slug)}
                  className="hover:text-emerald-700 transition-colors"
                >
                  {subcategory.name}
                </button>
              </>
            )}
            <ChevronRight size={10} className="text-neutral-400" />
            <span className="text-neutral-800 font-bold truncate max-w-[220px]">
              {product.name}
            </span>
          </nav>

          {subcategory && (
            <button
              onClick={() => setSubcategory(subcategory.slug)}
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-all"
            >
              <ArrowLeft size={11} />
              <span>Back to {subcategory.name}</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* COMPACT PRODUCT CARD (DESKTOP & MOBILE RESPONSIVE) */}
      {/* ========================================================= */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-1">
        <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden flex flex-col md:flex-row">
          {/* ----------------------------------------------------- */}
          {/* LEFT: Product Image & Freshness Badges */}
          {/* ----------------------------------------------------- */}
          <div className="md:w-[44%] p-3.5 sm:p-5 border-b md:border-b-0 md:border-r border-neutral-100 flex flex-col justify-between relative bg-white">
            {/* Top Row: Discount Pill & Wishlist Button */}
            <div className="flex items-center justify-between w-full z-10">
              {pricing.hasDiscount ? (
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                  {pricing.percent}% OFF
                </span>
              ) : (
                <span />
              )}
              <button
                onClick={handleToggleWishlist}
                title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                className="hidden lg:flex w-7 h-7 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/60 items-center justify-center transition-all active:scale-95 shadow-xs"
              >
                <Heart
                  size={14}
                  className={isWishlisted ? 'text-rose-500 fill-rose-500' : 'text-neutral-500'}
                />
              </button>
            </div>

            {/* Compact Product Image */}
            <div className="relative w-full h-44 sm:h-52 md:h-60 flex items-center justify-center p-2 my-1">
              <SafeImage
                src={product.image}
                alt={product.name}
                iconSize={32}
                className="max-h-full max-w-full h-full w-full object-contain transition-transform duration-300 hover:scale-105"
              />
            </div>

            {/* Quick Guarantees Strip */}
            <div className="grid grid-cols-3 gap-1 pt-2.5 border-t border-neutral-100 text-center">
              <div className="flex flex-col items-center">
                <Leaf size={12} className="text-emerald-700 mb-0.5" />
                <span className="text-[9.5px] font-bold text-neutral-800 leading-tight">100% Fresh</span>
                <span className="text-[8.5px] text-neutral-400">Quality</span>
              </div>
              <div className="flex flex-col items-center border-x border-neutral-100">
                <Truck size={12} className="text-emerald-700 mb-0.5" />
                <span className="text-[9.5px] font-bold text-neutral-800 leading-tight">Fast</span>
                <span className="text-[8.5px] text-neutral-400">Doorstep</span>
              </div>
              <div className="flex flex-col items-center">
                <Banknote size={12} className="text-emerald-700 mb-0.5" />
                <span className="text-[9.5px] font-bold text-neutral-800 leading-tight">COD</span>
                <span className="text-[8.5px] text-neutral-400">Available</span>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------- */}
          {/* RIGHT: Product Details, Variants & Actions */}
          {/* ----------------------------------------------------- */}
          <div className="md:w-[56%] p-3.5 sm:p-5 flex flex-col justify-between gap-3 bg-white">
            <div className="flex flex-col gap-3">
              {/* Category & Brand Tag */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                  <Leaf size={11} className="text-emerald-700" />
                  {subcategory?.name || category?.name || 'Fresh Produce'}
                </span>
                {product.brand && (
                  <span className="text-[11px] text-neutral-500 font-medium">
                    Brand: <span className="font-semibold text-neutral-700">{product.brand.name}</span>
                  </span>
                )}
              </div>

              {/* Product Title & Stock Status */}
              <div>
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-neutral-900 leading-snug">
                  {product.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                    {currentWeight}
                  </span>
                  {selectedVariant && selectedVariant.stock > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      In Stock
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/50">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Price Block */}
              <div className="py-2.5 border-y border-neutral-100 flex items-baseline justify-between">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                    ₹{currentPrice}
                  </span>
                  {currentOriginalPrice > currentPrice && (
                    <>
                      <span className="text-sm text-neutral-400 line-through font-medium">
                        ₹{currentOriginalPrice}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-md">
                        {pricing.percent}% OFF · Save ₹{Math.round(savings)}
                      </span>
                    </>
                  )}
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">
                  (Inclusive of all taxes)
                </span>
              </div>

              {/* Pack sizes — each one can be added on its own, so a shopper
                  wanting the ₹5 and the ₹20 pack does not have to choose. */}
              {product.variants && product.variants.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10.5px] font-bold text-neutral-500 uppercase tracking-wider">
                    {product.variants.length > 1 ? 'Pack sizes — add any you want' : 'Pack size'}
                  </span>
                  <PackPicker
                    product={product}
                    selectedId={selectedVariant?.id}
                    onSelect={setSelectedVariant}
                  />
                </div>
              )}

              {/* Desktop Add to Cart Button */}
              <div className="hidden md:flex items-center gap-3 pt-1">
                {selectedVariant && (
                  qty === 0 ? (
                    <button
                      onClick={() => addToCart(product, selectedVariant)}
                      disabled={selectedVariant.stock <= 0}
                      className="w-full max-w-[200px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all disabled:opacity-50"
                    >
                      <ShoppingCart size={15} />
                      <span>{selectedVariant.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                    </button>
                  ) : (
                    <div className="w-full max-w-[200px] flex items-center justify-between bg-emerald-600 rounded-xl px-3 py-1.5 text-white shadow-xs">
                      <button
                        onClick={() => {
                          if (qty <= 1) {
                            removeFromCart(product.id, selectedVariant.id);
                          } else {
                            updateCartQuantity(product.id, selectedVariant.id, qty - 1);
                          }
                        }}
                        className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center active:scale-90 transition-all"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} className="stroke-[3]" />
                      </button>
                      <span className="text-xs font-bold">{qty} in cart</span>
                      <button
                        onClick={() => addToCart(product, selectedVariant)}
                        className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center active:scale-90 transition-all"
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} className="stroke-[3]" />
                      </button>
                    </div>
                  )
                )}
              </div>

              {/* Delivery info card */}
              <div className="bg-neutral-50 rounded-xl p-2.5 border border-neutral-200/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <Truck size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-neutral-500 font-medium leading-none">Delivering to</p>
                    <p className="text-[11.5px] font-bold text-neutral-800 truncate mt-0.5">
                      {deliveryLocation.area ? `${deliveryLocation.area}, ${deliveryLocation.city}` : deliveryLocation.city || 'Standard Express Delivery'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('profile')}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex-shrink-0 px-2 py-0.5"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Product Details Section */}
            <div className="pt-2.5 border-t border-neutral-100 flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-1.5 text-neutral-700">
                <Info size={12} className="text-emerald-700" />
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-700">
                  Product Details
                </span>
              </div>
              <p className="text-[11.5px] text-neutral-600 leading-relaxed">
                {product.description ||
                  'Fresh and authentic product procured daily and delivered under hygienic standards.'}
              </p>
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {product.tags.map((tag) => (
                    <span key={tag} className="text-[9.5px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded capitalize">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* RELATED / SIMILAR PRODUCTS */}
        {/* ======================================================= */}
        {relatedProducts.length > 0 && (
          <div className="mt-6 sm:mt-8">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight">
                  Customers Also Bought
                </h2>
                <p className="text-[11px] text-neutral-500">
                  More from {subcategory?.name || 'this category'}
                </p>
              </div>
              {subcategory && (
                <button
                  onClick={() => setSubcategory(subcategory.slug)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 transition-colors"
                >
                  <span>See All</span>
                  <ChevronRight size={11} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
              {relatedProducts.map((p) => (
                <ZeptoProductCard key={p.id} product={p} className="w-full" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MOBILE FIXED BOTTOM ACTION BAR (Compact) */}
      {/* ========================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-2.5 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 z-40 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-neutral-900">₹{currentPrice}</span>
              {currentOriginalPrice > currentPrice && (
                <span className="text-[11px] text-neutral-400 line-through">₹{currentOriginalPrice}</span>
              )}
            </div>
            <p className="text-[9.5px] text-neutral-500 font-medium leading-none">{currentWeight}</p>
          </div>

          <div className="flex-1 max-w-[170px]">
            {selectedVariant && (
              qty === 0 ? (
                <button
                  onClick={() => addToCart(product, selectedVariant)}
                  disabled={selectedVariant.stock <= 0}
                  className="w-full bg-emerald-600 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-all disabled:opacity-50"
                >
                  <ShoppingCart size={13} />
                  <span>{selectedVariant.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                </button>
              ) : (
                <div className="flex items-center justify-between bg-emerald-600 text-white font-bold text-xs py-1 px-2.5 rounded-xl shadow-xs">
                  <button
                    onClick={() => {
                      if (qty <= 1) {
                        removeFromCart(product.id, selectedVariant.id);
                      } else {
                        updateCartQuantity(product.id, selectedVariant.id, qty - 1);
                      }
                    }}
                    className="w-5 h-5 flex items-center justify-center hover:opacity-80 active:scale-90"
                    aria-label="Decrease"
                  >
                    <Minus size={11} className="stroke-[3]" />
                  </button>
                  <span className="font-bold text-[11px] min-w-[16px] text-center">{qty}</span>
                  <button
                    onClick={() => addToCart(product, selectedVariant)}
                    className="w-5 h-5 flex items-center justify-center hover:opacity-80 active:scale-90"
                    aria-label="Increase"
                  >
                    <Plus size={11} className="stroke-[3]" />
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
