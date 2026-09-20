import React from 'react';
import { Star, Plus, Minus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { type ZeptoProductItem, convertToProductWithVariants } from '../data/homeZeptoData';

interface ZeptoProductCardProps {
  item: ZeptoProductItem;
}

export default function ZeptoProductCard({ item }: ZeptoProductCardProps) {
  const { cart, addToCart, updateCartQuantity, removeFromCart, openProduct } = useApp();

  const productObj = convertToProductWithVariants(item);
  const variant = productObj.variants[0];

  // Find if item is in cart
  const cartItem = cart.find(c => c.product.id === item.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(productObj, variant);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartItem) {
      updateCartQuantity(item.id, variant.id, quantity + 1);
    } else {
      addToCart(productObj, variant);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity <= 1) {
      removeFromCart(item.id, variant.id);
    } else {
      updateCartQuantity(item.id, variant.id, quantity - 1);
    }
  };

  return (
    <div
      onClick={() => openProduct(item.id)}
      className="w-[140px] sm:w-[155px] md:w-[164px] flex-shrink-0 bg-white rounded-2xl border border-neutral-200/80 p-2.5 flex flex-col justify-between hover:shadow-lg transition-all duration-200 cursor-pointer group select-none relative"
    >
      <div>
        {/* Product Image Area */}
        <div className="relative w-full aspect-square bg-[#F8F9FA] rounded-xl flex items-center justify-center p-2 mb-2 overflow-hidden border border-neutral-100">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* ADD Button or Counter overlay */}
          <div className="absolute bottom-1.5 right-1.5 z-10">
            {quantity === 0 ? (
              <button
                type="button"
                onClick={handleAdd}
                className="bg-white hover:bg-[#FF3269] text-[#FF3269] hover:text-white border-2 border-[#FF3269] font-black text-xs px-3 py-0.5 rounded-lg shadow-sm active:scale-95 transition-all flex items-center justify-center"
              >
                ADD
              </button>
            ) : (
              <div className="bg-[#FF3269] text-white text-xs font-bold px-1.5 py-0.5 rounded-lg shadow-sm flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="w-4 h-4 flex items-center justify-center hover:opacity-80 active:scale-90"
                >
                  <Minus size={11} className="stroke-[3]" />
                </button>
                <span className="min-w-[12px] text-center font-black text-xs">{quantity}</span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-4 h-4 flex items-center justify-center hover:opacity-80 active:scale-90"
                >
                  <Plus size={11} className="stroke-[3]" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pricing & Discount */}
        <div className="mt-1">
          <div className="flex items-center gap-1.5">
            <span className="bg-[#15803D] text-white text-xs font-black px-1.5 py-0.5 rounded-[4px] tracking-tight">
              ₹{item.price}
            </span>
            {item.original_price > item.price && (
              <span className="text-[10px] text-neutral-400 line-through font-medium">
                ₹{item.original_price}
              </span>
            )}
          </div>
          {item.discount > 0 && (
            <p className="text-[10px] text-[#15803D] font-bold mt-0.5 leading-none">
              ₹{item.discount} OFF
            </p>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xs font-semibold text-neutral-800 line-clamp-2 leading-snug min-h-[32px] mt-1.5 group-hover:text-primary-600 transition-colors">
          {item.name}
        </h3>

        {/* Pack Size / Weight */}
        <p className="text-[11px] text-neutral-500 font-normal mt-0.5">
          {item.weight}
        </p>

        {/* Attribute Tag (e.g. Stain Removal, Eco-friendly, Best Seller) */}
        {item.tag && (
          <div className="mt-1">
            <span
              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded inline-block ${
                item.tag.toLowerCase().includes('eco')
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-sky-50 text-sky-700 border border-sky-100'
              }`}
            >
              {item.tag}
            </span>
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1 text-[10px] text-neutral-600 font-medium mt-1.5 pt-1 border-t border-neutral-100/80">
        <Star size={10} className="fill-[#15803D] text-[#15803D]" />
        <span className="font-bold text-neutral-800">{item.rating}</span>
        <span className="text-neutral-400">({item.reviews})</span>
      </div>
    </div>
  );
}
