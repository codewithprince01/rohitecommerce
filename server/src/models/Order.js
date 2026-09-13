import mongoose from 'mongoose';
import { baseSchemaOptions } from './_plugins.js';

const { ObjectId } = mongoose.Schema.Types;

export const ORDER_STATUSES = [
  'pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'returned',
];
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
export const PAYMENT_METHODS = ['cod', 'card', 'upi', 'wallet'];

const orderSchema = new mongoose.Schema(
  {
    order_number: { type: String, required: true, unique: true, index: true },
    customer_id: { type: ObjectId, ref: 'Customer', default: null, index: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    payment_status: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    payment_method: { type: String, enum: PAYMENT_METHODS, default: 'cod' },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    delivery_fee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    coupon_id: { type: ObjectId, ref: 'Coupon', default: null },
    coupon_code: { type: String, default: null },
    delivery_address: { type: mongoose.Schema.Types.Mixed, default: null },
    notes: { type: String, default: null },
    placed_at: { type: Date, default: Date.now, index: true },
    delivery_eta: { type: String, default: null },
    delivered_at: { type: Date, default: null },
    rating: { type: Number, default: null },
    rating_review: { type: String, default: null },
    rating_tags: { type: [String], default: [] },
    rider: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  baseSchemaOptions
);

orderSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customer_id',
  foreignField: '_id',
  justOne: true,
});
orderSchema.virtual('items', {
  ref: 'OrderItem',
  localField: '_id',
  foreignField: 'order_id',
});

export const Order = mongoose.model('Order', orderSchema);

/* ------------------------------ Order item ------------------------------ */
const orderItemSchema = new mongoose.Schema(
  {
    order_id: { type: ObjectId, ref: 'Order', required: true, index: true },
    product_id: { type: ObjectId, ref: 'Product', default: null },
    variant_id: { type: ObjectId, ref: 'ProductVariant', default: null },
    product_name: { type: String, required: true },
    variant_label: { type: String, default: null },
    unit_price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    line_total: { type: Number, required: true },
  },
  baseSchemaOptions
);
export const OrderItem = mongoose.model('OrderItem', orderItemSchema);

/* -------------------------- Order status history -------------------------- */
const statusHistorySchema = new mongoose.Schema(
  {
    order_id: { type: ObjectId, ref: 'Order', required: true, index: true },
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: { type: String, default: null },
    changed_by: { type: ObjectId, ref: 'AdminUser', default: null },
  },
  baseSchemaOptions
);
export const OrderStatusHistory = mongoose.model('OrderStatusHistory', statusHistorySchema);
