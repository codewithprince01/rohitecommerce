/**
 * Storefront domain types.
 *
 * These mirror the Express/MongoDB API's response shapes. The file is named
 * after the database this project started on; it no longer talks to any
 * service and holds nothing but types — every page fetches through
 * lib/data.ts (storefront) or admin/lib/api.ts (console).
 */

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          image: string | null;
          bg_color: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          image?: string | null;
          bg_color?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      subcategories: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          image: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          slug: string;
          image?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subcategories']['Insert']>;
      };
      brands: {
        Row: {
          id: string;
          subcategory_id: string;
          name: string;
          slug: string;
          logo: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subcategory_id: string;
          name: string;
          slug: string;
          logo?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['brands']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          brand_id: string;
          category_id: string;
          subcategory_id: string;
          name: string;
          slug: string;
          description: string | null;
          image: string | null;
          is_available: boolean;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          category_id: string;
          subcategory_id: string;
          name: string;
          slug: string;
          description?: string | null;
          image?: string | null;
          is_available?: boolean;
          tags?: string[];
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          quantity: string;
          price: number;
          original_price: number;
          discount: number;
          stock: number;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          quantity: string;
          price: number;
          original_price: number;
          discount?: number;
          stock?: number;
          is_available?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['product_variants']['Insert']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};

// Enhanced types with relations
export type Category = Database['public']['Tables']['categories']['Row'] & {
  subcategories?: Subcategory[];
  subcategory_count?: number;
  product_count?: number;
  brand_count?: number;
};

export type Subcategory = Database['public']['Tables']['subcategories']['Row'] & {
  brands?: Brand[];
  /** Parent summary as the list endpoint returns it — not the full category row. */
  category?: Pick<Category, 'id' | 'name' | 'slug'>;
  product_count?: number;
  brand_count?: number;
};

export type Brand = Database['public']['Tables']['brands']['Row'] & {
  products?: ProductWithVariants[];
  subcategory?: Subcategory;
};

export type Product = Database['public']['Tables']['products']['Row'] & {
  variants?: ProductVariant[];
};

export type ProductVariant = Database['public']['Tables']['product_variants']['Row'];

export type ProductWithVariants = Product & {
  variants: ProductVariant[];
  brand?: Omit<Brand, 'products'>;
  category?: Category;
  subcategory?: Subcategory;
};
