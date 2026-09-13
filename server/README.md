# FreshMart Backend (Node.js + Express + MongoDB)

Production-grade REST API powering the FreshMart storefront and admin panel.
Replaces the previous Supabase backend.

## Stack
- **Express 4** — HTTP layer, security middleware (helmet, cors, rate-limit, compression)
- **MongoDB + Mongoose 8** — data layer
- **JWT** access/refresh auth + role-based access control (super_admin / manager / staff)
- **Zod** request validation
- Audit logging + admin notifications on every write

## Getting started
```bash
cd server
cp .env.example .env        # then edit secrets / Mongo URI
npm install
npm run seed:fresh          # creates super admin + sample catalog/orders
npm run dev                 # starts on http://localhost:4000
```

Default super-admin (from `.env`): `admin@freshmart.com` / `Admin@12345`.

## Project layout
```
src/
  config/        env, db, logger, permissions (RBAC matrix)
  middleware/    auth, rbac, validation, rate-limit, error handler
  models/        Mongoose schemas (catalog, orders, customers, ops…)
  modules/       feature modules (controller + routes + validators)
    auth/ dashboard/ products/ orders/ customers/ categories/ …
  routes/        central API router (mounted at /api)
  services/      cross-cutting services (activity log, notifications)
  utils/         ApiError, ApiResponse, asyncHandler, query helpers, CRUD factory
  seed/          database seeder
```

## API surface (so far)
All admin endpoints require `Authorization: Bearer <accessToken>` and the
relevant permission.

| Area       | Routes |
|------------|--------|
| Auth       | `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/change-password` |
| Dashboard  | `GET /api/dashboard?range=7d\|30d\|90d` |
| Products   | `GET/POST /api/products`, `GET/PATCH/DELETE /api/products/:id`, `POST /api/products/bulk/{availability,delete}` |
| Orders     | `GET/POST /api/orders`, `GET /api/orders/:id`, `GET /api/orders/:id/history`, `PATCH /api/orders/:id/{status,payment}`, `DELETE /api/orders/:id` |
| Customers  | `GET/POST /api/customers`, `GET/PATCH/DELETE /api/customers/:id` (detail includes order history + lifetime stats) |
| Categories | `GET/POST/PATCH/DELETE /api/categories` (+ `/sub`, `/brand` sub-resources) |

Response envelope: `{ success, data, meta? }` for success, `{ success:false, error:{ message, details? } }` for errors. Lists return `{ data: { rows, total }, meta: { page, pageSize, pages } }`.

## Roadmap (next phases)
Coupons, banners, inventory (+ stock adjustments/ledger), delivery zones,
payment methods, notifications feed, store settings, admin-user management,
activity log browse, reports/CSV export, file uploads, billing & subscriptions, CMS.
