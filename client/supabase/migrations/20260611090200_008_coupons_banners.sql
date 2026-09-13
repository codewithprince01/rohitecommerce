/*
  # Coupons & Banners

  1. New Tables
    - `coupons` - Discount codes
      - code (unique), description
      - type: 'percent' | 'fixed'
      - value (percent or rupees), min_order, max_discount
      - usage_limit, used_count
      - starts_at, ends_at, is_active
    - `banners` - Promotional banners / slides
      - title, subtitle, image
      - link_type: 'none'|'category'|'subcategory'|'brand'|'product'|'url'
      - link_value (slug/id/url)
      - position (e.g. 'home_hero', 'home_strip'), sort_order
      - starts_at, ends_at, is_active

  2. Security
    - Coupons: admin-only (validation happens server-side / at checkout later).
    - Banners: admin write, PUBLIC read of active banners for the storefront.
*/

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'percent' CHECK (type IN ('percent','fixed')),
  value numeric(10,2) NOT NULL DEFAULT 0,
  min_order numeric(10,2) NOT NULL DEFAULT 0,
  max_discount numeric(10,2),
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);

-- Banners
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image text,
  bg_color text DEFAULT 'bg-primary-500',
  link_type text NOT NULL DEFAULT 'none'
    CHECK (link_type IN ('none','category','subcategory','brand','product','url')),
  link_value text,
  position text NOT NULL DEFAULT 'home_hero',
  sort_order integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position, sort_order);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Coupons: admin only
CREATE POLICY "Admins manage coupons" ON coupons
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Banners: public can read active banners, admins manage
CREATE POLICY "Public can view active banners" ON banners
  FOR SELECT TO public
  USING (is_active = true);

CREATE POLICY "Admins manage banners" ON banners
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
