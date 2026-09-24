import React, { useState } from 'react';
import { Plus, Minus, Heart, ImageOff, ChevronDown, X } from 'lucide-react';
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

  // The cheapest pack is what the card advertises. A product with no packs has
  // no price to show and cannot be added to the cart — the admin has not
  // finished setting it up, and inventing a price would mislead the shopper.
  const packs = product.variants?.length ? [...product.variants].sort((a, b) => a.price - b.price) : [];
  const variant: ProductVariant | undefined = packs[0];
  const hasChoice = packs.length > 1;

  const id = product.id;
  const { price, originalPrice, savings, percent: discountPercent } = variantPricing(variant);
  // In stock if *any* pack has stock — a card showing "out of stock" because
  // only the cheapest pack ran out would hide packs we can still sell.
  const inStock = packs.some((v) => v.stock > 0);
  const isFav = isInWishlist(id) || (Boolean(product.slug) && isInWishlist(product.slug));

  const cartItem = variant ? cart.find((c) => c.product.id === id && c.variant.id === variant.id) : undefined;
  const quantity = cartItem?.quantity ?? 0;
  // Across every pack, so the badge matches what this product contributes to the cart.
  const totalInCart = cart
    .filter((c) => c.product.id === id)
    .reduce((sum, c) => sum + c.quantity, 0);

  /**
   * One pack adds straight to the cart; several open the picker, so choosing
   * between ₹5 / ₹10 / ₹20 does not mean opening the product page first.
   */
  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChoice) {
      setPacksOpen(true);
      return;
    }
    if (variant && variant.stock > 0) addToCart(product, variant);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!variant) return;
    if (cartItem) updateCartQuantity(id, variant.id, quantity + 1);
    else addToCart(product, variant);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!variant) return;
    if (quantity <= 1) removeFromCart(id, variant.id);
    else updateCartQuantity(id, variant.id, quantity - 1);
  };

  return (
    <div
      onClick={() => openProduct(id)}
      className={`bg-white rounded-2xl border border-neutral-200/80 hover:border-emerald-300 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 cursor-pointer group select-none relative overflow-hidden ${
        className || 'w-[140px] sm:w-[152px] md:w-[162px] flex-shrink-0'
      }`}
    >
      <div>
        {/* Product image — a neutral tile when the admin has not set one yet */}
        <div className="relative w-full h-24 sm:h-28 bg-neutral-50 overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff size={20} className="text-neutral-300" />
            </div>
          )}

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

          {discountPercent > 0 && (
            <span className="absolute top-1.5 left-1.5 bg-[#15803D] text-white text-[9.5px] font-black px-1.5 py-0.5 rounded-[4px] shadow-sm leading-tight z-10">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        <div className="p-2 pt-1">
          {variant ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="bg-[#15803D] text-white text-[10.5px] font-black px-1.5 py-0.5 rounded-[4px] leading-tight">
                  {hasChoice ? `from ₹${price}` : `₹${price}`}
                </span>
                {originalPrice > price && (
                  <span className="text-[9.5px] text-neutral-400 line-through font-medium leading-none">
                    ₹{originalPrice}
                  </span>
                )}
              </div>
              {savings > 0 && (
                <p className="text-[9px] text-[#15803D] font-bold mt-0.5 leading-none">
                  Save ₹{Math.round(savings)}
                </p>
              )}
            </>
          ) : (
            <span className="inline-block text-[9.5px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-[4px] leading-tight">
              Price coming soon
            </span>
          )}

          <h3 className="text-[11px] sm:text-[11.5px] font-semibold text-neutral-800 line-clamp-2 leading-tight min-h-[26px] mt-0.5 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>

          <p className="text-[9.5px] text-neutral-500 font-normal mt-0.5 leading-tight">
            {hasChoice ? `${packs.length} pack sizes` : variant?.quantity ?? '—'}
          </p>
        </div>
      </div>

      {/* Footer: real inventory on the left, the add control in the corner.
          There is no rating here — we have never collected one, and a made-up
          score would be a claim about other shoppers that nobody made. */}
      <div className="px-2 pb-2 pt-1 mt-auto border-t border-neutral-100 flex items-end justify-between gap-1.5">
        <span className={`text-[9px] font-medium leading-tight ${inStock ? 'text-neutral-500' : 'text-rose-500 font-semibold'}`}>
          {inStock ? 'In stock' : 'Out of stock'}
        </span>

        {variant && (
          hasChoice ? (
            <button
              type="button"
              onClick={handleAdd}
              disabled={!inStock && totalInCart === 0}
              className={`font-black text-[10.5px] px-3 py-1 rounded-lg shadow-sm active:scale-95 transition-all leading-tight shrink-0 flex items-center gap-1 border-2 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-primary-600 ${
                totalInCart > 0
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white hover:bg-primary-600 text-primary-600 hover:text-white border-primary-500'
              }`}
            >
              {totalInCart > 0 ? `${totalInCart} ADDED` : 'ADD'}
              <ChevronDown size={11} className="stroke-[3]" />
            </button>
          ) : quantity === 0 ? (
            <button
              type="button"
              onClick={handleAdd}
              disabled={!inStock}
              className="bg-white hover:bg-primary-600 text-primary-600 hover:text-white border-2 border-primary-500 font-black text-[10.5px] px-3 py-1 rounded-lg shadow-sm active:scale-95 transition-all leading-tight shrink-0 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-primary-600"
            >
              ADD
            </button>
          ) : (
            <div className="bg-primary-600 text-white rounded-lg shadow-sm flex items-center gap-2 px-1.5 py-1 shrink-0">
              <button
                type="button"
                onClick={handleDecrement}
                aria-label="Decrease quantity"
                className="w-3.5 h-3.5 flex items-center justify-center hover:opacity-80 active:scale-90"
              >
                <Minus size={10} className="stroke-[3]" />
              </button>
              <span className="min-w-[10px] text-center font-black text-[10.5px] leading-none">{quantity}</span>
              <button
                type="button"
                onClick={handleIncrement}
                aria-label="Increase quantity"
                className="w-3.5 h-3.5 flex items-center justify-center hover:opacity-80 active:scale-90"
              >
                <Plus size={10} className="stroke-[3]" />
              </button>
            </div>
          )
        )}
      </div>

      {/* Pack picker — several packs can be given a quantity in one go. */}
      {packsOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => {
            e.stopPropagation();
            setPacksOpen(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl border border-neutral-100 max-h-[80vh] flex flex-col"
          >
            <div className="flex items-start justify-between gap-3 p-4 border-b border-neutral-100">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-neutral-900 truncate">{product.name}</h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">Choose pack sizes — you can add more than one</p>
              </div>
              <button
                type="button"
                onClick={() => setPacksOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 overflow-y-auto">
              <PackPicker product={product} />
            </div>

            <div className="p-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setPacksOpen(false)}
                className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold active:scale-95 transition-all"
              >
                {totalInCart > 0 ? `Done · ${totalInCart} in cart` : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
