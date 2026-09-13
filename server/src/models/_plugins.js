// Shared schema options + a toJSON transform that exposes `id` (string) instead
// of `_id`/`__v`, so API payloads match the frontend's snake_case domain types.

export const baseSchemaOptions = {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret) {
      ret.id = ret._id?.toString();
      delete ret._id;
      // never leak password hashes even if a query forgot to exclude them
      delete ret.password;
      return ret;
    },
  },
  toObject: { virtuals: true },
};
