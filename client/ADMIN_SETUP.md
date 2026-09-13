# FreshMart Admin Panel — Setup

The admin panel lives under **`/admin`** and is fully isolated from the storefront
(`src/main.tsx` mounts `AdminApp` only when the URL path starts with `/admin`).

## 1. Apply the database migrations

The admin needs new tables + admin write policies. Apply migrations `006`–`010`
(in `supabase/migrations/`) to your Supabase project. Either:

- **Supabase CLI:** `supabase db push`, or
- **Dashboard:** open SQL Editor and run each file in order:
  1. `..._006_admin_auth_rbac.sql` — `admin_users`, `is_admin()`, `admin_role()`, `is_super_admin()`
  2. `..._007_customers_orders.sql` — customers, addresses, orders, order_items, history
  3. `..._008_coupons_banners.sql` — coupons, banners
  4. `..._009_inventory_settings_logs.sql` — inventory ledger, settings, delivery, payments, notifications, activity logs (also seeds defaults)
  5. `..._010_admin_write_policies.sql` — lets admins write to the existing catalog tables

## 2. Create your first admin

The very first super-admin must be created manually (only existing super-admins can
mint new admins from the UI).

1. **Auth → Users → Add user** in the Supabase dashboard. Create a user with an email
   and password, and confirm it. Copy the user's UUID.
2. In **SQL Editor**, insert the matching admin row:

   ```sql
   insert into admin_users (id, email, full_name, role, is_active)
   values ('<paste-user-uuid>', 'you@freshmart.com', 'Your Name', 'super_admin', true);
   ```

## 3. Sign in

Run the app (`npm run dev`) and visit **`/admin`**. You'll be redirected to
`/admin/login`. Sign in with the credentials from step 2.

## Roles & permissions

| Role          | Access |
|---------------|--------|
| `super_admin` | Everything, including Admin Users & Settings management |
| `manager`     | Everything except managing admin accounts / dangerous settings |
| `staff`       | Read catalog & customers, fulfil orders, adjust stock — no deletes |

Permissions are defined in `src/admin/lib/permissions.ts`; both the sidebar and the
route guards consult them, so unauthorized sections are hidden **and** blocked.

## Notes

- Every create/update/delete is written to `activity_logs` (Activity Logs page).
- Order status changes follow a guarded workflow (`ORDER_TRANSITIONS` in `lib/format.ts`)
  and append to `order_status_history` + drop a team notification.
- The storefront has no checkout that *creates* orders yet, so the admin manages orders
  directly. When you build checkout, insert into `orders` / `order_items` (see
  `createOrder` in `lib/services/orders.service.ts`).
- `npm run typecheck` and `npm run build` are clean. `npm run lint` shows only
  intentional `any`-at-DB-boundary **warnings** for admin code (the shared Supabase
  client is untyped); pre-existing storefront lint errors are unrelated to the admin.
```
