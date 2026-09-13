import mongoose from 'mongoose';
import { baseSchemaOptions } from './_plugins.js';

const { ObjectId } = mongoose.Schema.Types;

/* ----------------------------- Category ----------------------------- */
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    image: { type: String, default: null },
    bg_color: { type: String, default: 'bg-neutral-100' },
    sort_order: { type: Number, default: 0 },
  },
  baseSchemaOptions
);
export const Category = mongoose.model('Category', categorySchema);

/* ---------------------------- Subcategory ---------------------------- */
const subcategorySchema = new mongoose.Schema(
  {
    category_id: { type: ObjectId, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    image: { type: String, default: null },
    sort_order: { type: Number, default: 0 },
  },
  baseSchemaOptions
);
subcategorySchema.index({ category_id: 1, slug: 1 }, { unique: true });
subcategorySchema.virtual('category', {
  ref: 'Category',
  localField: 'category_id',
  foreignField: '_id',
  justOne: true,
});
export const Subcategory = mongoose.model('Subcategory', subcategorySchema);

/* ------------------------------- Brand ------------------------------- */
const brandSchema = new mongoose.Schema(
  {
    subcategory_id: { type: ObjectId, ref: 'Subcategory', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    logo: { type: String, default: null },
    description: { type: String, default: null },
  },
  baseSchemaOptions
);
brandSchema.index({ subcategory_id: 1, slug: 1 }, { unique: true });
export const Brand = mongoose.model('Brand', brandSchema);

/* ------------------------------ Product ------------------------------ */
const productSchema = new mongoose.Schema(
  {
    brand_id: { type: ObjectId, ref: 'Brand', required: true, index: true },
    category_id: { type: ObjectId, ref: 'Category', required: true, index: true },
    subcategory_id: { type: ObjectId, ref: 'Subcategory', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    description: { type: String, default: null },
    image: { type: String, default: null },
    is_available: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
  },
  baseSchemaOptions
);
productSchema.index({ name: 'text', description: 'text' });
productSchema.virtual('variants', {
  ref: 'ProductVariant',
  localField: '_id',
  foreignField: 'product_id',
});
productSchema.virtual('brand', { ref: 'Brand', localField: 'brand_id', foreignField: '_id', justOne: true });
productSchema.virtual('category', { ref: 'Category', localField: 'category_id', foreignField: '_id', justOne: true });
productSchema.virtual('subcategory', { ref: 'Subcategory', localField: 'subcategory_id', foreignField: '_id', justOne: true });
export const Product = mongoose.model('Product', productSchema);

/* -------------------------- Product Variant -------------------------- */
const variantSchema = new mongoose.Schema(
  {
    product_id: { type: ObjectId, ref: 'Product', required: true, index: true },
    quantity: { type: String, required: true }, // pack size label, e.g. "500g"
    price: { type: Number, required: true },
    original_price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    stock: { type: Number, default: 100, index: true },
    // Per-SKU reorder point. Falls back to the module default (10) for legacy
    // documents created before this field existed (handled via $ifNull in
    // aggregations). Lets each pack size carry its own low-stock alert level.
    low_stock_threshold: { type: Number, default: 10, min: 0 },
    is_available: { type: Boolean, default: true },
  },
  baseSchemaOptions
);
variantSchema.virtual('product', { ref: 'Product', localField: 'product_id', foreignField: '_id', justOne: true });
export const ProductVariant = mongoose.model('ProductVariant', variantSchema);
