import React from 'react';
import { Star, Plus, Minus, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { type ZeptoProductItem, convertToProductWithVariants } from '../data/homeZeptoData';
import type { ProductWithVariants, ProductVariant } from '../lib/supabase';

interface ZeptoProductCardProps {
  item?: ZeptoProductItem;
  product?: ProductWithVariants;
  className?: string;
  removeFromWishlistOnAdd?: boolean;
}

export default function ZeptoProductCard({
  item,
  product,
  className = '',
  removeFromWishlistOnAdd = false,
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

  const productObj: ProductWithVariants = product
    ? product
    : item
    ? convertToProductWithVariants(item)
    : ({} as ProductWithVariants);

  const variant: ProductVariant = productObj.variants?.[0] || {
    id: `${productObj.id}-v0`,
    product_id: productObj.id,
    quantity: '1 pack',
    price: 40,
    original_price: 50,
    discount: 10,
    stock: 50,
    is_available: true,
    created_at: new Date().toISOString(),
  };

  const id = productObj.id;
  const name = productObj.name;
  const image = productObj.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=compress&cs=tinysrgb&w=300';
  const price = variant.price;
  const originalPrice = variant.original_price || price;
  const discountAmount = originalPrice > price ? originalPrice - price : 0;
  const weight = variant.quantity || '1 pack';
  const rating = item?.rating || 4.7;
  const reviews = item?.reviews || '1.8k';

  const isFav = isInWishlist(id) || (Boolean(productObj.slug) && isInWishlist(productObj.slug));

  // Find if item is in cart
  const cartItem = cart.find((c) => c.product.id === id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(productObj, variant);
    if (removeFromWishlistOnAdd) {
      removeFromWishlist(id);
      if (productObj.slug) removeFromWishlist(productObj.slug);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartItem) {
      updateCartQuantity(id, variant.id, quantity + 1);
    } else {
      addToCart(productObj, variant);
    }
    if (removeFromWishlistOnAdd) {
      removeFromWishlist(id);
      if (productObj.slug) removeFromWishlist(productObj.slug);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity <= 1) {
      removeFromCart(id, variant.id);
    } else {
      updateCartQuantity(id, variant.id, quantity - 1);
    }
  };

  return (
    <div
      onClick={() => openProduct(id)}
      className={`bg-white rounded-2xl border border-neutral-200/80 hover:border-emerald-300 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 cursor-pointer group select-none relative overflow-hidden ${
        className || 'w-[140px] sm:w-[152px] md:w-[162px] flex-shrink-0'
      }`}
    >
      <div>
        {/* Product Image Area */}
        <div className="relative w-full h-24 sm:h-28 bg-white overflow-hidden">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Wishlist Heart Button at Top-Right */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isFav) {
                removeFromWishlist(id);
                if (productObj.slug) removeFromWishlist(productObj.slug);
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

          {/* ADD Button or Counter overlay at Bottom-Right of Image */}
          <div className="absolute bottom-1 right-1 z-10">
            {quantity === 0 ? (
              <button
                type="button"
                onClick={handleAdd}
                className="bg-white hover:bg-primary-600 text-primary-600 hover:text-white border-2 border-primary-500 font-black text-[10.5px] px-2 py-0.5 rounded-lg shadow-sm active:scale-95 transition-all flex items-center justify-center leading-tight"
              >
                ADD
              </button>
            ) : (
              <div className="bg-primary-600 text-white text-[10.5px] font-bold px-1.5 py-0.5 rounded-lg shadow-sm flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="w-3 h-3 flex items-center justify-center hover:opacity-80 active:scale-90"
                >
                  <Minus size={9} className="stroke-[3]" />
                </button>
                <span className="min-w-[8px] text-center font-black text-[10.5px]">{quantity}</span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-3 h-3 flex items-center justify-center hover:opacity-80 active:scale-90"
                >
                  <Plus size={9} className="stroke-[3]" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Section below Image */}
        <div className="p-2 pt-1">
          {/* Pricing & Discount */}
          <div className="flex items-baseline gap-1">
            <span className="bg-[#15803D] text-white text-[10.5px] font-black px-1.5 py-0.5 rounded-[4px] leading-tight">
              ₹{price}
            </span>
            {originalPrice > price && (
              <span className="text-[9.5px] text-neutral-400 line-through font-medium leading-none">
                ₹{originalPrice}
              </span>
            )}
          </div>
          {discountAmount > 0 && (
            <p className="text-[9px] text-[#15803D] font-bold mt-0.5 leading-none">
              ₹{discountAmount} OFF
            </p>
          )}

          {/* Title */}
          <h3 className="text-[11px] sm:text-[11.5px] font-semibold text-neutral-800 line-clamp-2 leading-tight min-h-[26px] mt-0.5 group-hover:text-primary-600 transition-colors">
            {name}
          </h3>

          {/* Pack Size / Weight */}
          <p className="text-[9.5px] text-neutral-500 font-normal mt-0.5 leading-tight">
            {weight}
          </p>
        </div>
      </div>

      {/* Rating Footer */}
      <div className="px-2 pb-1.5">
        <div className="flex items-center gap-1 text-[9px] text-neutral-600 font-medium pt-1 border-t border-neutral-100">
          <Star size={8.5} className="fill-[#15803D] text-[#15803D]" />
          <span className="font-bold text-neutral-800">{rating}</span>
          <span className="text-neutral-400">({reviews})</span>
        </div>
      </div>
    </div>
  );
}
