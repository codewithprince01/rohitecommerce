/*
  # Admin Authentication & RBAC

  1. New Tables
    - `admin_users` - Staff accounts that can access the admin panel
      - `id` (uuid, pk, references auth.users) - the Supabase auth user
      - `email` (text)
      - `full_name` (text)
      - `role` (text) - one of 'super_admin' | 'manager' | 'staff'
      - `is_active` (boolean) - disabled admins cannot pass guards
      - `last_login_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Helper Functions (SECURITY DEFINER, used by every admin RLS policy)
    - `is_admin()` - true if the current auth.uid() is an active admin_user
    - `admin_role()` - returns the role text for the current admin (or null)

  3. Security
    - Enable RLS. Admins can read all admin rows. Only super_admin can write
      admin rows (managed in the Admin Users module).
    - A user reads their OWN admin row (needed at login to resolve role).
*/

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin', 'manager', 'staff')),
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- Helper: is the current user an active admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() AND is_active = true
  );
$$;

-- Helper: role of the current admin (null if not an admin)
CREATE OR REPLACE FUNCTION admin_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM admin_users
  WHERE id = auth.uid() AND is_active = true
  LIMIT 1;
$$;

-- Helper: is the current admin a super_admin?
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() AND is_active = true AND role = 'super_admin'
  );
$$;

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Any active admin can list/read admin users (the module decides visibility)
CREATE POLICY "Admins can read admin_users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (is_admin() OR id = auth.uid());

-- Only super_admins can create/update/delete admin accounts
CREATE POLICY "Super admins can insert admin_users"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update admin_users"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can delete admin_users"
  ON admin_users FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- Allow an admin to stamp their own last_login_at at sign-in time
CREATE POLICY "Admins can update own last_login"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
