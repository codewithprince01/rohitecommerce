import type { ProductVariant } from './supabase';

/**
 * What a pack actually costs, and what the shopper actually saves.
 *
 * The three stored fields can disagree — the admin form lets a Discount % be
 * typed without raising the MRP, and importers fill whichever columns a
 * supplier sheet happened to have. A discount is therefore treated as real
 * only when the MRP is genuinely higher than the selling price; otherwise
 * there is no saving to advertise, whatever the percentage field says.
 *
 * Card and product page both read this, so the same pack can never show a
 * discount in one place and none in the other.
 */
export interface VariantPricing {
  price: number;
  originalPrice: number;
  /** Rupees off the MRP. Zero when the MRP is not higher than the price. */
  savings: number;
  /** Whole-percent discount, zero unless there is a real saving. */
  percent: number;
  hasDiscount: boolean;
}

export function variantPricing(variant?: ProductVariant | null): VariantPricing {
  const price = variant?.price ?? 0;
  const originalPrice = variant?.original_price ?? price;
  const savings = originalPrice > price ? originalPrice - price : 0;

  if (savings <= 0) {
    return { price, originalPrice, savings: 0, percent: 0, hasDiscount: false };
  }

  // Prefer the stored percentage when it agrees with the prices, so the shop
  // sees its own number rather than a rounding of it.
  const derived = (savings / originalPrice) * 100;
  const stored = variant?.discount ?? 0;
  const percent = Math.round(stored > 0 && Math.abs(stored - derived) <= 1 ? stored : derived);

  return { price, originalPrice, savings, percent, hasDiscount: percent > 0 };
}
