import React, { useState, useEffect } from 'react';
import { Plus, Minus, ChevronDown, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ProductWithVariants, ProductVariant } from '../lib/supabase';

interface ProductCardProps {
  product: ProductWithVariants;
  horizontal?: boolean;
  className?: string;
}

export default function ProductCard({ product, horizontal = false, className }: ProductCardProps) {
  const { addToCart, openProduct, cart, updateCartQuantity, removeFromCart, toggleWishlist, isInWishlist } = useApp();
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] || null
  );

  const isFav = isInWishlist(product.id);

  // Find cart items for this product
  const cartItems = cart.filter(i => i.product.id === product.id);
  const totalQuantity = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    if (product.variants?.length && !selectedVariant) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product.variants, selectedVariant]);

  if (horizontal) {
    return (
      <div className={`flex items-center gap-3 bg-white rounded-2xl p-3 shadow-card hover:shadow-card-hover transition-shadow relative ${
        showVariantSelector ? 'z-20 shadow-card-hover' : 'z-10'
      }`}>
        <div className="relative flex-shrink-0">
          <button onClick={() => openProduct(product.id)} className="block">
            <img
              src={product.image || 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400'}
              alt={product.name}
              className="w-20 h-20 object-cover rounded-xl"
              loading="lazy"
            />
            {selectedVariant && selectedVariant.discount > 0 && (
              <span className="absolute top-1 left-1 bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                {selectedVariant.discount}% OFF
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            title={isFav ? 'Remove from wishlist' : 'Save to wishlist'}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all"
          >
            <Heart size={12} className={isFav ? 'text-rose-500 fill-rose-500' : 'text-neutral-400'} />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <button onClick={() => openProduct(product.id)} className="text-left block w-full">
            <p className="text-sm font-semibold text-neutral-800 line-clamp-2 leading-tight">{product.name}</p>
            {product.brand && (
              <p className="text-xs text-primary-600 font-medium mt-0.5">{product.brand.name}</p>
            )}
          </button>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <button
              onClick={() => setShowVariantSelector(!showVariantSelector)}
              className="flex items-center gap-1.5 mt-1.5 bg-neutral-100 rounded-lg px-2 py-1 text-xs text-neutral-600"
            >
              <span>{selectedVariant?.quantity}</span>
              <ChevronDown size={12} />
            </button>
          )}

          <div className="flex items-center justify-between mt-2">
            <div>
              {selectedVariant && (
                <>
                  <span className="text-sm font-bold text-neutral-800">Rs {selectedVariant.price}</span>
                  {selectedVariant.original_price > selectedVariant.price && (
                    <span className="text-xs text-neutral-400 line-through ml-1.5">Rs {selectedVariant.original_price}</span>
                  )}
                </>
              )}
            </div>

            {totalQuantity === 0 ? (
              <button
                onClick={() => selectedVariant && addToCart(product, selectedVariant)}
                disabled={!selectedVariant}
                className="px-3 py-1.5 bg-primary-500 text-white rounded-xl text-xs font-semibold active:scale-95 transition-transform disabled:opacity-50"
              >
                Add
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-primary-500 rounded-xl px-2 py-1">
                <button
                  onClick={() => {
                    if (cartItems[0]) {
                      if (cartItems[0].quantity <= 1) {
                        removeFromCart(cartItems[0].product.id, cartItems[0].variant.id);
                      } else {
                        updateCartQuantity(cartItems[0].product.id, cartItems[0].variant.id, cartItems[0].quantity - 1);
                      }
                    }
                  }}
                >
                  <Minus size={12} className="text-white" />
                </button>
                <span className="text-xs font-bold text-white min-w-[12px] text-center">{totalQuantity}</span>
                <button
                  onClick={() => selectedVariant && addToCart(product, selectedVariant)}
                  disabled={!selectedVariant}
                >
                  <Plus size={12} className="text-white" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Variant Selector Dropdown */}
        {showVariantSelector && product.variants && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-card-hover border border-neutral-100 z-10">
            {product.variants.map(v => (
              <button
                key={v.id}
                onClick={() => {
                  setSelectedVariant(v);
                  setShowVariantSelector(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm ${
                  selectedVariant?.id === v.id ? 'bg-primary-50 text-primary-700' : 'hover:bg-neutral-50'
                }`}
              >
                <span>{v.quantity}</span>
                <span className="font-semibold">Rs {v.price}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-card hover:shadow-card-hover border border-neutral-100 transition-all flex flex-col justify-between ${className ? className : 'w-40 lg:w-44 flex-shrink-0'} relative ${
      showVariantSelector ? 'z-20 shadow-card-hover' : 'z-10'
    }`}>
      <div>
        <div className="relative w-full rounded-t-2xl overflow-hidden group bg-neutral-50 aspect-square">
          <button onClick={() => openProduct(product.id)} className="block w-full h-full text-left">
            <img
              src={product.image || 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400'}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {selectedVariant && selectedVariant.discount > 0 && (
              <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-sm">
                {selectedVariant.discount}% OFF
              </span>
            )}
            {product.tags && product.tags[0] && (
              <span className="absolute bottom-2 left-2 bg-neutral-900/80 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                {product.tags[0]}
              </span>
            )}
          </button>
          {/* Wishlist Heart button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            title={isFav ? 'Remove from wishlist' : 'Save to wishlist'}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all z-10"
          >
            <Heart size={13} className={isFav ? 'text-rose-500 fill-rose-500' : 'text-neutral-400'} />
          </button>
        </div>

        <div className="p-3 pb-1">
          <button onClick={() => openProduct(product.id)} className="text-left block w-full group/title">
            <p className="text-xs sm:text-sm font-semibold text-neutral-800 line-clamp-2 leading-snug min-h-[34px] group-hover/title:text-primary-600 transition-colors">
              {product.name}
            </p>
            {product.brand && (
              <p className="text-[11px] text-primary-600 font-semibold mt-0.5 truncate">
                {product.brand.name}
              </p>
            )}
          </button>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="relative mt-2">
              <button
                type="button"
                onClick={() => setShowVariantSelector(!showVariantSelector)}
                className="flex items-center justify-between w-full bg-neutral-50 hover:bg-neutral-100 rounded-lg px-2 py-1 text-xs text-neutral-700 border border-neutral-200 transition-colors"
              >
                <span className="font-medium truncate">{selectedVariant?.quantity}</span>
                <ChevronDown size={12} className="text-neutral-400 flex-shrink-0 ml-1" />
              </button>

              {showVariantSelector && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-neutral-200 py-1 z-30 max-h-48 overflow-y-auto">
                  {product.variants.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariant(v);
                        setShowVariantSelector(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                        selectedVariant?.id === v.id ? 'bg-primary-50 text-primary-700 font-bold' : 'hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <span>{v.quantity}</span>
                      <span className="font-bold">Rs {v.price}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 pt-2">
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100">
          <div className="min-w-0">
            {selectedVariant && (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs sm:text-sm font-black text-neutral-900">Rs {selectedVariant.price}</span>
                </div>
                {selectedVariant.original_price > selectedVariant.price && (
                  <span className="block text-[10px] text-neutral-400 line-through leading-none">
                    Rs {selectedVariant.original_price}
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            {totalQuantity === 0 ? (
              <button
                type="button"
                onClick={() => selectedVariant && addToCart(product, selectedVariant)}
                disabled={!selectedVariant}
                className="px-3 py-1.5 bg-primary-50 hover:bg-primary-500 text-primary-700 hover:text-white border border-primary-300 hover:border-primary-500 rounded-xl text-xs font-black active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1 shadow-sm"
              >
                <Plus size={13} className="stroke-[3]" />
                <span>ADD</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-primary-600 text-white rounded-xl px-2 py-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    if (cartItems[0]) {
                      if (cartItems[0].quantity <= 1) {
                        removeFromCart(cartItems[0].product.id, cartItems[0].variant.id);
                      } else {
                        updateCartQuantity(cartItems[0].product.id, cartItems[0].variant.id, cartItems[0].quantity - 1);
                      }
                    }
                  }}
                  className="w-4 h-4 flex items-center justify-center hover:opacity-80 active:scale-90 transition-transform"
                >
                  <Minus size={12} className="stroke-[2.5]" />
                </button>
                <span className="text-xs font-black min-w-[14px] text-center">{totalQuantity}</span>
                <button
                  type="button"
                  onClick={() => selectedVariant && addToCart(product, selectedVariant)}
                  disabled={!selectedVariant}
                  className="w-4 h-4 flex items-center justify-center hover:opacity-80 active:scale-90 transition-transform"
                >
                  <Plus size={12} className="stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
