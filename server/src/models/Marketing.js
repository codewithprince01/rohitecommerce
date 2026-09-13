import mongoose from 'mongoose';
import { baseSchemaOptions } from './_plugins.js';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, default: null },
    type: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    value: { type: Number, default: 0 },
    min_order: { type: Number, default: 0 },
    max_discount: { type: Number, default: null },
    usage_limit: { type: Number, default: null },
    used_count: { type: Number, default: 0 },
    starts_at: { type: Date, default: null },
    ends_at: { type: Date, default: null },
    is_active: { type: Boolean, default: true, index: true },
  },
  baseSchemaOptions
);
export const Coupon = mongoose.model('Coupon', couponSchema);

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: null },
    image: { type: String, default: null },
    bg_color: { type: String, default: 'bg-primary-500' },
    link_type: {
      type: String,
      enum: ['none', 'category', 'subcategory', 'brand', 'product', 'url'],
      default: 'none',
    },
    link_value: { type: String, default: null },
    position: { type: String, default: 'home_hero', index: true },
    sort_order: { type: Number, default: 0 },
    starts_at: { type: Date, default: null },
    ends_at: { type: Date, default: null },
    is_active: { type: Boolean, default: true },
  },
  baseSchemaOptions
);
export const Banner = mongoose.model('Banner', bannerSchema);
