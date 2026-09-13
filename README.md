# FreshMart — Full-Stack Grocery E-Commerce Platform

A production-grade grocery storefront with an enterprise admin panel, split into a
React client and a Node.js/Express/MongoDB server.

```
React_Ecomm/
├── client/        # React + TypeScript + Vite + Tailwind frontend (storefront + /admin)
├── server/        # Node.js + Express + MongoDB REST API
└── package.json   # workspace convenience scripts
```

## Quick start

```bash
# 1. Install dependencies for both apps
npm run install:all

# 2. Configure the backend
cp server/.env.example server/.env     # edit Mongo URI + JWT secrets
npm run seed:fresh                      # super admin + sample data

# 3. Run both (in two terminals)
npm run dev:server                      # http://localhost:4000  (API)
npm run dev:client                      # http://localhost:5173  (web)
```

Default admin login (from `server/.env`): `admin@freshmart.com` / `Admin@12345`.

## Apps

### `client/` — Frontend
React 18 + TypeScript + Vite + Tailwind. The storefront lives at `/` and the
admin panel at `/admin`. See `client/` for its own config.

### `server/` — Backend
Express + Mongoose REST API with JWT auth, role-based access control, request
validation (zod), rate limiting, audit logging and notifications. See
[`server/README.md`](server/README.md) for the API reference and roadmap.

## Migration status
The project is migrating off its original Supabase backend onto the new
Express/MongoDB server. The Express API foundation + core modules (auth,
dashboard, products, orders, customers, categories) are in place. The frontend
data layer is being rewired from the Supabase client to the REST API; until that
is complete the legacy `client/supabase` SQL migrations remain for reference.
