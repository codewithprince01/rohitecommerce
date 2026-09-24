import React, { useState } from 'react';
import { Plus, Minus, Heart, ImageOff, X, Check, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ProductWithVariants, ProductVariant } from '../lib/supabase';
import { variantPricing } from '../lib/pricing';
import PackPicker from './PackPicker';

interface ZeptoProductCardProps {
  product: ProductWithVariants;
  className?: string;
  removeFromWishlistOnAdd?: boolean;
}

export default function ZeptoProductCard({
  product,
  className = '',
}: ZeptoProductCardProps) {
  const {
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    openProduct,
    toggleWishlist,
    removeFromWishlist,
    isInWishlist,
  } = useApp();

  const [packsOpen, setPacksOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // The cheapest pack is what the card advertises.
  const packs = product.variants?.length ? [...product.variants].sort((a, b) => a.price - b.price) : [];
  const variant: ProductVariant | undefined = packs[0];
  const hasChoice = packs.length > 1;

  const id = product.id;
  const { price, originalPrice, savings, percent: discountPercent } = variantPricing(variant);
  // In stock if *any* pack has stock
  const inStock = packs.some((v) => v.stock > 0);
  const isFav = isInWishlist(id) || (Boolean(product.slug) && isInWishlist(product.slug));

  // Across all packs for this product
  const totalInCart = cart
    .filter((c) => c.product.id === id)
    .reduce((sum, c) => sum + c.quantity, 0);

  /**
   * Clicking ADD opens the pack selection modal whenever multiple sizes exist,
   * or toggles the modal to adjust if already added.
   */
  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChoice) {
      setPacksOpen(true);
      return;
    }
    if (variant && variant.stock > 0) {
      if (totalInCart > 0) {
        setPacksOpen(true);
      } else {
        addToCart(product, variant);
      }
    }
  };

  const hasImage = Boolean(product.image) && !imgError;

  return (
    <div
      onClick={() => openProduct(id)}
      className={`bg-white rounded-2xl border border-neutral-200/90 hover:border-emerald-500/60 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 cursor-pointer group select-none relative overflow-hidden ${
        className || 'w-[136px] sm:w-[150px] md:w-[162px] flex-shrink-0'
      }`}
    >
      <div>
        {/* Product image container — cleanly framed, handles missing & broken images */}
        <div className="relative w-full h-28 sm:h-32 bg-neutral-50/80 overflow-hidden flex items-center justify-center border-b border-neutral-100/70">
          {hasImage ? (
            <img
              src={product.image!}
              alt={product.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50/70 via-amber-50/30 to-neutral-100 p-2 relative overflow-hidden select-none">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/95 shadow-xs border border-emerald-100/80 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600/80" />
              </div>
              <span className="text-[9px] font-semibold text-neutral-500 mt-1.5 truncate max-w-full px-1 text-center">
                {product.subcategory?.name || product.category?.name || 'Fresh Grocery'}
              </span>
            </div>
          )}

          {/* Wishlist toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isFav) {
                removeFromWishlist(id);
                if (product.slug) removeFromWishlist(product.slug);
              } else {
                toggleWishlist(id);
              }
            }}
            title={isFav ? 'Remove from wishlist' : 'Save to wishlist'}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 transition-all z-10"
          >
            <Heart
              size={12}
              className={isFav ? 'text-rose-500 fill-rose-500' : 'text-neutral-400 hover:text-neutral-600'}
            />
          </button>

          {/* Discount badge */}
          {discountPercent > 0 && (
            <span className="absolute top-1.5 left-1.5 bg-[#0c831f] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs leading-tight z-10">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Product details */}
        <div className="p-2 pt-1.5">
          {variant ? (
            <div>
              <div className="flex items-baseline gap-1">
                <span className="bg-[#0c831f] text-white text-[10px] font-black px-1.5 py-0.5 rounded leading-tight">
                  {hasChoice ? `from ₹${price}` : `₹${price}`}
                </span>
                {originalPrice > price && (
                  <span className="text-[9.5px] text-neutral-400 line-through font-medium leading-none">
                    ₹{originalPrice}
                  </span>
                )}
              </div>
              {savings > 0 && (
                <p className="text-[8.5px] text-[#0c831f] font-bold mt-0.5 leading-none">
                  Save ₹{Math.round(savings)}
                </p>
              )}
            </div>
          ) : (
            <span className="inline-block text-[9.5px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded leading-tight">
              Price soon
            </span>
          )}

          <h3 className="text-[11.5px] font-semibold text-neutral-800 line-clamp-2 leading-snug min-h-[28px] mt-1 group-hover:text-emerald-700 transition-colors">
            {product.name}
          </h3>

          <p className="text-[9.5px] text-neutral-500 font-medium mt-0.5 leading-tight">
            {hasChoice ? `${packs.length} pack sizes` : variant?.quantity ?? '—'}
          </p>
        </div>
      </div>

      {/* Footer: real inventory on the left, clean ADD / ADDED button on the right */}
      <div className="px-2 pb-2 pt-0.5 mt-auto flex items-center justify-between gap-1">
        <span className={`text-[9px] font-semibold leading-tight ${inStock ? 'text-emerald-700' : 'text-rose-500'}`}>
          {inStock ? 'In stock' : 'Out of stock'}
        </span>

        {variant && (
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inStock && totalInCart === 0}
            className={`font-black text-[11px] px-3 py-1 rounded-lg shadow-xs active:scale-95 transition-all leading-tight shrink-0 flex items-center justify-center gap-1 border-2 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#0c831f] ${
              totalInCart > 0
                ? 'bg-[#0c831f] hover:bg-[#096618] text-white border-[#0c831f]'
                : 'bg-white hover:bg-emerald-50 text-[#0c831f] border-[#0c831f]'
            }`}
          >
            {totalInCart > 0 ? (
              <>
                <Check size={11} className="stroke-[3]" />
                <span>ADDED</span>
              </>
            ) : (
              'ADD'
            )}
          </button>
        )}
      </div>

      {/* Pack picker modal — opens when clicked to choose pack sizes */}
      {packsOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setPacksOpen(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl border border-neutral-100 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300"
          >
            {/* Mobile drag handle */}
            <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden" />

            <div className="flex items-start justify-between gap-3 p-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-100 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                  {hasImage ? (
                    <img src={product.image!} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <Package className="w-5 h-5 text-emerald-600/70" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-neutral-900 truncate">{product.name}</h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    {hasChoice ? 'Choose pack size — you can add more than one' : 'Pack size details'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPacksOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 shrink-0 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3.5 overflow-y-auto max-h-[50vh]">
              <PackPicker product={product} />
            </div>

            <div className="p-3 border-t border-neutral-100 bg-neutral-50/50 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setPacksOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#0c831f] hover:bg-[#096618] text-white text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Done</span>
                {totalInCart > 0 && <span className="opacity-90 font-medium">({totalInCart} in cart)</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
