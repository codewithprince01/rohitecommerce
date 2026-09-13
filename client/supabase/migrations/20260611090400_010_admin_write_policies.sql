/*
  # Admin write policies for existing catalog tables

  The original schema (001) only granted public SELECT on catalog tables.
  This adds INSERT/UPDATE/DELETE for active admins so the admin panel can
  manage the catalog. Public read policies remain untouched.
*/

-- Categories
CREATE POLICY "Admins manage categories" ON categories
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Subcategories
CREATE POLICY "Admins manage subcategories" ON subcategories
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Brands
CREATE POLICY "Admins manage brands" ON brands
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Products
CREATE POLICY "Admins manage products" ON products
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Product variants
CREATE POLICY "Admins manage product_variants" ON product_variants
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
