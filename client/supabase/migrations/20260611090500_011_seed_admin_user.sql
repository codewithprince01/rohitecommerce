/*
  # Seed first super-admin

  Creates the Supabase Auth user rohit@gmail.com (password: Rohit@1234) AND the
  matching admin_users row with role 'super_admin'. Run this AFTER migration 006
  (which creates admin_users). Idempotent — safe to run more than once.

  Run it in the Supabase Dashboard → SQL Editor (it executes as the privileged
  postgres role, so it bypasses the admin_users RLS that would otherwise block
  the first insert).

  ⚠️ Change the password after first login in a real deployment.
*/

-- pgcrypto provides crypt()/gen_salt() for the bcrypt password hash.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  uid uuid;
BEGIN
  -- Reuse the auth user if it already exists, otherwise create it.
  SELECT id INTO uid FROM auth.users WHERE email = 'rohit@gmail.com';

  IF uid IS NULL THEN
    uid := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'rohit@gmail.com', crypt('Rohit@1234', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), uid, uid::text,
      json_build_object('sub', uid::text, 'email', 'rohit@gmail.com', 'email_verified', true),
      'email', now(), now(), now()
    );
  END IF;

  -- Create/refresh the admin record (bypasses RLS here because we're postgres).
  INSERT INTO admin_users (id, email, full_name, role, is_active)
  VALUES (uid, 'rohit@gmail.com', 'Rohit', 'super_admin', true)
  ON CONFLICT (id) DO UPDATE
    SET role = 'super_admin', is_active = true, email = EXCLUDED.email;
END $$;
