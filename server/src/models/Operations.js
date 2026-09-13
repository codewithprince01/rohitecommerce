import mongoose from 'mongoose';
import { baseSchemaOptions } from './_plugins.js';

const { ObjectId } = mongoose.Schema.Types;

/* ----------------------- Inventory movement ledger ----------------------- */
const inventoryMovementSchema = new mongoose.Schema(
  {
    variant_id: { type: ObjectId, ref: 'ProductVariant', required: true, index: true },
    change: { type: Number, required: true },
    resulting_stock: { type: Number, default: null },
    reason: {
      type: String,
      enum: ['manual', 'restock', 'sale', 'correction', 'return', 'damage', 'stocktake', 'transfer'],
      default: 'manual',
    },
    reference: { type: String, default: null },
    note: { type: String, default: null },
    created_by: { type: ObjectId, ref: 'AdminUser', default: null },
  },
  baseSchemaOptions
);
export const InventoryMovement = mongoose.model('InventoryMovement', inventoryMovementSchema);

/* ----------------------------- Delivery zone ----------------------------- */
const deliveryZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    pincodes: { type: [String], default: [] },
    fee: { type: Number, default: 0 },
    min_order: { type: Number, default: 0 },
    free_above: { type: Number, default: null },
    eta_minutes: { type: Number, default: 30 },
    is_active: { type: Boolean, default: true },
  },
  baseSchemaOptions
);
export const DeliveryZone = mongoose.model('DeliveryZone', deliveryZoneSchema);

/* ---------------------------- Payment method ----------------------------- */
const paymentMethodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    is_enabled: { type: Boolean, default: true },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    sort_order: { type: Number, default: 0 },
  },
  baseSchemaOptions
);
export const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

/* ----------------------------- Notification ------------------------------ */
const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['info', 'order', 'stock', 'customer', 'system'], default: 'info' },
    title: { type: String, required: true },
    body: { type: String, default: null },
    link: { type: String, default: null },
    is_read: { type: Boolean, default: false, index: true },
  },
  baseSchemaOptions
);
export const Notification = mongoose.model('Notification', notificationSchema);

/* ----------------------------- Activity log ------------------------------ */
const activityLogSchema = new mongoose.Schema(
  {
    admin_user_id: { type: ObjectId, ref: 'AdminUser', default: null },
    admin_email: { type: String, default: null },
    action: { type: String, required: true },
    entity_type: { type: String, default: null },
    entity_id: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  baseSchemaOptions
);
activityLogSchema.index({ created_at: -1 });
export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

/* ----------------------------- Store setting ----------------------------- */
const storeSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  baseSchemaOptions
);
export const StoreSetting = mongoose.model('StoreSetting', storeSettingSchema);
