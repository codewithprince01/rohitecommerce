// Legacy types for backward compatibility - will be migrated to database types
import type { ProductWithVariants, ProductVariant, Category, Subcategory, Brand } from '../lib/supabase';

export type { ProductWithVariants as Product, ProductVariant, Category, Subcategory, Brand };

// Promotional banners are now real, admin-managed records served from the
// backend (`GET /api/banners/public`). See `src/lib/banners.ts`. The old
// hardcoded `offers` dummy array was removed.
