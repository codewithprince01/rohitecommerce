/*
 * Seed the first super-admin from the terminal.
 *
 * Requires the SERVICE ROLE key (Supabase Dashboard → Project Settings → API →
 * service_role secret). It bypasses RLS and can create auth users, so the
 * chicken-and-egg "only a super-admin can add admins" rule does not apply.
 *
 * Prerequisite: migration 006 (admin_users table) must already be applied.
 *
 * Usage (PowerShell):
 *   $env:SUPABASE_SERVICE_ROLE_KEY="<service_role key>"; node scripts/seed-admin.mjs
 *
 * Usage (bash):
 *   SUPABASE_SERVICE_ROLE_KEY="<service_role key>" node scripts/seed-admin.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const EMAIL = 'rohit@gmail.com';
const PASSWORD = 'Rohit@1234';
const FULL_NAME = 'Rohit';

// Read VITE_SUPABASE_URL from .env (or env var) so we hit the right project.
function readEnv(key) {
  if (process.env[key]) return process.env[key];
  try {
    const line = readFileSync(new URL('../.env', import.meta.url), 'utf8')
      .split('\n')
      .find((l) => l.startsWith(`${key}=`));
    return line ? line.slice(key.length + 1).trim() : undefined;
  } catch {
    return undefined;
  }
}

const url = readEnv('VITE_SUPABASE_URL');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  console.error('❌ VITE_SUPABASE_URL not found (.env or env var).');
  process.exit(1);
}
if (!serviceKey) {
  console.error('❌ Set SUPABASE_SERVICE_ROLE_KEY (Dashboard → Settings → API → service_role).');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let userId;
const { data: created, error } = await admin.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,
});

if (error) {
  if (/already|registered|exists/i.test(error.message)) {
    // User already exists — find their id.
    const { data: list, error: listErr } = await admin.auth.admin.listUsers();
    if (listErr) throw listErr;
    userId = list.users.find((u) => u.email === EMAIL)?.id;
    console.log('ℹ️  Auth user already existed, reusing it.');
  } else {
    throw error;
  }
} else {
  userId = created.user.id;
  console.log('✅ Created auth user.');
}

if (!userId) throw new Error('Could not resolve the user id.');

const { error: upErr } = await admin
  .from('admin_users')
  .upsert({ id: userId, email: EMAIL, full_name: FULL_NAME, role: 'super_admin', is_active: true });
if (upErr) throw upErr;

console.log(`✅ Seeded super-admin: ${EMAIL} (password: ${PASSWORD})`);
console.log('→ Sign in at /admin');
