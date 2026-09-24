import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { variantPricing } from '../lib/pricing';
import type { ProductWithVariants, ProductVariant } from '../lib/supabase';

interface PackPickerProps {
  product: ProductWithVariants;
  /** Highlight a row and report taps — the product page uses this to preview a pack. */
  selectedId?: string;
  onSelect?: (variant: ProductVariant) => void;
  className?: string;
}

/**
 * Every pack size of a product, each with its own quantity stepper.
 *
 * A shopper buying ₹5, ₹10 and ₹20 packs of the same item should not have to
 * pick one, add it, come back and pick the next — so each row edits the cart
 * directly and several packs can carry a quantity at the same time.
 *
 * There is no local draft state: the cart is the single source of truth, so
 * what this list shows is always what the shopper will actually pay for.
 */
export default function PackPicker({ product, selectedId, onSelect, className = '' }: PackPickerProps) {
  const { cart, addToCart, updateCartQuantity, removeFromCart } = useApp();

  const packs = [...(product.variants ?? [])].sort((a, b) => a.price - b.price);
  if (packs.length === 0) return null;

  const qtyOf = (variantId: string) =>
    cart.find((c) => c.product.id === product.id && c.variant.id === variantId)?.quantity ?? 0;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {packs.map((v) => {
        const { price, originalPrice, percent } = variantPricing(v);
        const inStock = v.stock > 0;
        const qty = qtyOf(v.id);
        const isSelected = selectedId === v.id;

        return (
          <div
            key={v.id}
            onClick={() => onSelect?.(v)}
            className={`flex items-center justify-between gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${
              onSelect ? 'cursor-pointer' : ''
            } ${
              isSelected
                ? 'border-[#0c831f] bg-emerald-50/60 shadow-xs'
                : qty > 0
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
            } ${!inStock ? 'opacity-60' : ''}`}
          >
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-800 truncate">{v.quantity}</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xs font-black text-neutral-900">₹{price}</span>
                {originalPrice > price && (
                  <span className="text-[10px] text-neutral-400 line-through">₹{originalPrice}</span>
                )}
                {percent > 0 && (
                  <span className="text-[10px] font-bold text-[#0c831f]">{percent}% off</span>
                )}
              </div>
              {!inStock && <p className="text-[10px] font-semibold text-rose-500 mt-0.5">Out of stock</p>}
            </div>

            {inStock ? (
              qty === 0 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product, v);
                  }}
                  className="shrink-0 bg-white hover:bg-[#0c831f] text-[#0c831f] hover:text-white border-2 border-[#0c831f] font-black text-[11px] px-3.5 py-1 rounded-lg active:scale-95 transition-all"
                >
                  ADD
                </button>
              ) : (
                <div className="shrink-0 bg-[#0c831f] text-white rounded-lg flex items-center gap-2 px-2 py-1 shadow-xs">
                  <button
                    type="button"
                    aria-label={`Remove one ${v.quantity}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (qty <= 1) removeFromCart(product.id, v.id);
                      else updateCartQuantity(product.id, v.id, qty - 1);
                    }}
                    className="w-4 h-4 flex items-center justify-center hover:opacity-80 active:scale-90"
                  >
                    <Minus size={11} className="stroke-[3]" />
                  </button>
                  <span className="min-w-[12px] text-center font-black text-[11px] leading-none">{qty}</span>
                  <button
                    type="button"
                    aria-label={`Add one ${v.quantity}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateCartQuantity(product.id, v.id, qty + 1);
                    }}
                    className="w-4 h-4 flex items-center justify-center hover:opacity-80 active:scale-90"
                  >
                    <Plus size={11} className="stroke-[3]" />
                  </button>
                </div>
              )
            ) : (
              <span className="shrink-0 text-[10px] font-bold text-neutral-400 px-2">—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
