import mongoose from 'mongoose';
import { baseSchemaOptions } from './_plugins.js';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, default: null, lowercase: true, trim: true, index: true },
    phone: { type: String, default: null, index: true },
    avatar: { type: String, default: null },
    gender: { type: String, default: null },
    dob: { type: String, default: null },
    alternate_phone: { type: String, default: null },
    is_blocked: { type: Boolean, default: false },
    notes: { type: String, default: null },
    wallet_balance: { type: Number, default: 0 },
    cashback_earned: { type: Number, default: 0 },
    is_vip: { type: Boolean, default: false },
    freshpass_expiry: { type: String, default: null },
    preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  baseSchemaOptions
);

customerSchema.virtual('addresses', {
  ref: 'Address',
  localField: '_id',
  foreignField: 'customer_id',
});

export const Customer = mongoose.model('Customer', customerSchema);

const addressSchema = new mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    label: { type: String, default: 'Home' },
    receiver_name: { type: String, default: null },
    receiver_phone: { type: String, default: null },
    line1: { type: String, required: true },
    line2: { type: String, default: null },
    landmark: { type: String, default: null },
    city: { type: String, required: true },
    state: { type: String, default: null },
    pincode: { type: String, required: true },
    delivery_instructions: { type: [String], default: [] },
    is_default: { type: Boolean, default: false },
  },
  baseSchemaOptions
);

export const Address = mongoose.model('Address', addressSchema);

const walletTransactionSchema = new mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String, default: null },
    reference_id: { type: String, default: null },
    created_at: { type: Date, default: Date.now },
  },
  baseSchemaOptions
);

export const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

const supportTicketSchema = new mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    ticket_number: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true },
    order_number: { type: String, default: null },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    responses: [
      {
        sender: { type: String, enum: ['customer', 'agent'], required: true },
        message: { type: String, required: true },
        created_at: { type: Date, default: Date.now },
      },
    ],
    created_at: { type: Date, default: Date.now },
  },
  baseSchemaOptions
);

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

