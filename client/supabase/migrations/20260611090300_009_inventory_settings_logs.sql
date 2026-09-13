/*
  # Inventory, Settings, Delivery, Payments, Notifications & Activity Logs

  1. New Tables
    - `inventory_movements` - Append-only stock change ledger (audit of stock)
    - `store_settings` - Singleton-ish key/value store for global config (jsonb)
    - `delivery_zones` - Delivery areas with fees / min order / ETA
    - `payment_methods` - Enabled payment options + config
    - `notifications` - Admin notification feed
    - `activity_logs` - Audit trail of every admin write action

  2. Security
    - All admin-only via is_admin().
*/

-- Inventory movements (ledger)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  change integer NOT NULL,
  resulting_stock integer,
  reason text NOT NULL DEFAULT 'manual'
    CHECK (reason IN ('manual','restock','sale','correction','return','damage')),
  reference text,
  note text,
  created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant ON inventory_movements(variant_id, created_at DESC);

-- Store settings (key/value)
CREATE TABLE IF NOT EXISTS store_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Delivery zones
CREATE TABLE IF NOT EXISTS delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pincodes text[] NOT NULL DEFAULT '{}',
  fee numeric(10,2) NOT NULL DEFAULT 0,
  min_order numeric(10,2) NOT NULL DEFAULT 0,
  free_above numeric(10,2),
  eta_minutes integer DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Notifications (admin feed)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'info'
    CHECK (type IN ('info','order','stock','customer','system')),
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(is_read, created_at DESC);

-- Activity logs (audit trail)
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_email text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- RLS: admin only
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage inventory_movements" ON inventory_movements
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- store_settings & delivery_zones & payment_methods readable by public storefront,
-- writable by admins (storefront needs fees / enabled methods at checkout later)
CREATE POLICY "Public can read store_settings" ON store_settings
  FOR SELECT TO public USING (true);
CREATE POLICY "Admins write store_settings" ON store_settings
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can read delivery_zones" ON delivery_zones
  FOR SELECT TO public USING (true);
CREATE POLICY "Admins write delivery_zones" ON delivery_zones
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can read payment_methods" ON payment_methods
  FOR SELECT TO public USING (true);
CREATE POLICY "Admins write payment_methods" ON payment_methods
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins manage notifications" ON notifications
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins read activity_logs" ON activity_logs
  FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admins insert activity_logs" ON activity_logs
  FOR INSERT TO authenticated WITH CHECK (is_admin());

-- Seed sensible defaults
INSERT INTO store_settings (key, value) VALUES
  ('general', '{"store_name":"FreshMart","currency":"INR","currency_symbol":"₹","support_email":"support@freshmart.com","support_phone":"+91 98765 43210"}'::jsonb),
  ('checkout', '{"tax_rate":0,"default_delivery_fee":25,"free_delivery_threshold":499}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO payment_methods (name, code, is_enabled, sort_order) VALUES
  ('Cash on Delivery', 'cod', true, 1),
  ('UPI', 'upi', true, 2),
  ('Credit / Debit Card', 'card', true, 3),
  ('Wallet', 'wallet', false, 4)
ON CONFLICT (code) DO NOTHING;
