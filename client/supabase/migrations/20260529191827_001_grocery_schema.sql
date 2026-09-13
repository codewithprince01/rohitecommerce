/*
  # Grocery E-Commerce Schema

  1. New Tables
    - `categories` - Main categories (Snacks & Namkeen, Dairy, Vegetables, etc.)
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `slug` (text, unique for URLs)
      - `image` (text, URL)
      - `bg_color` (text, background color class)
      - `sort_order` (integer)
    
    - `subcategories` - Sub-level categories (Namkeen, Biscuits, Chips, etc.)
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key to categories)
      - `name` (text)
      - `slug` (text)
      - `image` (text)
      - `sort_order` (integer)
    
    - `brands` - Brands (Haldiram, Lays, Britannia, etc.)
      - `id` (uuid, primary key)
      - `subcategory_id` (uuid, foreign key to subcategories)
      - `name` (text)
      - `slug` (text)
      - `logo` (text, brand logo URL)
      - `description` (text)
    
    - `products` - Products with multiple quantity variants
      - `id` (uuid, primary key)
      - `brand_id` (uuid, foreign key to brands)
      - `name` (text)
      - `slug` (text)
      - `description` (text)
      - `image` (text)
      - `category_id` (uuid, for filtering)
      - `subcategory_id` (uuid, for filtering)
      - `is_available` (boolean, default true)
      - `tags` (text array)
      - `created_at` (timestamp)
    
    - `product_variants` - Different pack sizes/quantities for each product
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `quantity` (text, e.g., "100g", "200g", "500g")
      - `price` (integer, in rupees)
      - `original_price` (integer, mrp)
      - `discount` (integer, percentage)
      - `stock` (integer, available quantity)
      - `is_available` (boolean)

  2. Security
    - Enable RLS on all tables
    - Public read access for all tables
    - No write access from frontend (use edge functions for orders)
*/

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  image text,
  bg_color text DEFAULT 'bg-neutral-100',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Subcategories Table
CREATE TABLE IF NOT EXISTS subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  image text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- Brands Table
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id uuid NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  logo text,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subcategory_id, slug)
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id uuid NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  image text,
  is_available boolean DEFAULT true,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(brand_id, slug)
);

-- Product Variants Table (for different quantities/prices)
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity text NOT NULL,
  price integer NOT NULL,
  original_price integer NOT NULL,
  discount integer DEFAULT 0,
  stock integer DEFAULT 100,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can view categories"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view subcategories"
  ON subcategories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view brands"
  ON brands FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view products"
  ON products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view product_variants"
  ON product_variants FOR SELECT
  TO public
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_brands_subcategory ON brands(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
