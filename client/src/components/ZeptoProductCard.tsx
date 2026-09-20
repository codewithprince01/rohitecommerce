import React from 'react';
import { Star, Plus, Minus, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { type ZeptoProductItem, convertToProductWithVariants } from '../data/homeZeptoData';
import type { ProductWithVariants, ProductVariant } from '../lib/supabase';

interface ZeptoProductCardProps {
  item?: ZeptoProductItem;
  product?: ProductWithVariants;
}

export default function ZeptoProductCard({ item, product }: ZeptoProductCardProps) {
  const {
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    openProduct,
    toggleWishlist,
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

  const isFav = isInWishlist(id);

  // Find if item is in cart
  const cartItem = cart.find((c) => c.product.id === id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(productObj, variant);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartItem) {
      updateCartQuantity(id, variant.id, quantity + 1);
    } else {
      addToCart(productObj, variant);
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
      className="w-[140px] sm:w-[152px] md:w-[162px] flex-shrink-0 bg-white rounded-2xl border border-neutral-200/80 hover:border-emerald-300 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 cursor-pointer group select-none relative overflow-hidden"
    >
      <div>
        {/* Product Image Area - Image goes flush to the top with rounded corners */}
        <div className="relative w-full h-28 sm:h-32 bg-white overflow-hidden">
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
              toggleWishlist(id);
            }}
            title={isFav ? 'Remove from wishlist' : 'Save to wishlist'}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all z-10"
          >
            <Heart
              size={13}
              className={isFav ? 'text-rose-500 fill-rose-500' : 'text-neutral-400 hover:text-neutral-600'}
            />
          </button>

          {/* ADD Button or Counter overlay at Bottom-Right of Image */}
          <div className="absolute bottom-1.5 right-1.5 z-10">
            {quantity === 0 ? (
              <button
                type="button"
                onClick={handleAdd}
                className="bg-white hover:bg-primary-600 text-primary-600 hover:text-white border-2 border-primary-500 font-black text-[11px] px-2.5 py-0.5 rounded-lg shadow-md active:scale-95 transition-all flex items-center justify-center"
              >
                ADD
              </button>
            ) : (
              <div className="bg-primary-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-lg shadow-md flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="w-3.5 h-3.5 flex items-center justify-center hover:opacity-80 active:scale-90"
                >
                  <Minus size={10} className="stroke-[3]" />
                </button>
                <span className="min-w-[10px] text-center font-black text-[11px]">{quantity}</span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-3.5 h-3.5 flex items-center justify-center hover:opacity-80 active:scale-90"
                >
                  <Plus size={10} className="stroke-[3]" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Section below Image */}
        <div className="p-2 sm:p-2.5 pt-1.5">
          {/* Pricing & Discount */}
          <div className="flex items-baseline gap-1">
            <span className="bg-[#15803D] text-white text-[11px] font-black px-1.5 py-0.5 rounded-[4px] leading-tight">
              ₹{price}
            </span>
            {originalPrice > price && (
              <span className="text-[10px] text-neutral-400 line-through font-medium leading-none">
                ₹{originalPrice}
              </span>
            )}
          </div>
          {discountAmount > 0 && (
            <p className="text-[9.5px] text-[#15803D] font-bold mt-0.5 leading-none">
              ₹{discountAmount} OFF
            </p>
          )}

          {/* Title */}
          <h3 className="text-[11.5px] sm:text-xs font-semibold text-neutral-800 line-clamp-2 leading-snug min-h-[28px] mt-1 group-hover:text-primary-600 transition-colors">
            {name}
          </h3>

          {/* Pack Size / Weight */}
          <p className="text-[10px] text-neutral-500 font-normal mt-0.5 leading-tight">
            {weight}
          </p>
        </div>
      </div>

      {/* Rating Footer */}
      <div className="px-2 sm:px-2.5 pb-2">
        <div className="flex items-center gap-1 text-[9.5px] text-neutral-600 font-medium pt-1.5 border-t border-neutral-100">
          <Star size={9} className="fill-[#15803D] text-[#15803D]" />
          <span className="font-bold text-neutral-800">{rating}</span>
          <span className="text-neutral-400">({reviews})</span>
        </div>
      </div>
    </div>
  );
}
