import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { baseSchemaOptions } from './_plugins.js';

const adminUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false },
    full_name: { type: String, default: '' },
    role: {
      type: String,
      enum: ['super_admin', 'manager', 'staff'],
      default: 'staff',
      index: true,
    },
    is_active: { type: Boolean, default: true },
    last_login_at: { type: Date, default: null },
  },
  baseSchemaOptions
);

adminUserSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminUserSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const AdminUser = mongoose.model('AdminUser', adminUserSchema);
