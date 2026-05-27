# admin-app (planned)

Internal admin panel for SmurfElite operations. **Not created yet.**

**Planned path:** `apps/admin-app`  
**Roadmap phase:** 7  
**Architecture decision:** Separate Next.js app in monorepo (not routes inside nextjs-app)

---

## Purpose

- Manage users, sellers, products, orders
- Handle enquiries and disputes
- Configure game categories (including restricted)
- Delist/reactivate sellers
- Record manual seller payouts
- View platform-wide metrics

---

## Access control

- All routes require `Role.ADMIN` JWT
- Login page rejects BUYER/SELLER tokens with clear message
- Reuse auth endpoints from express-server (`POST /auth/login`)
- Optional: separate admin subdomain in production (`admin.smurfelite.store`)

---

## Planned folder structure

```
apps/admin-app/
├── src/
│   ├── app/
│   │   ├── login/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx              # Dashboard overview
│   │   │   ├── users/
│   │   │   │   ├── page.tsx          # List + search
│   │   │   │   └── [userId]/page.tsx # Detail
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── enquiries/
│   │   │   ├── disputes/
│   │   │   ├── categories/
│   │   │   └── wallets/
│   │   └── layout.tsx
│   ├── api/                          # RTK Query (copy pattern from nextjs-app)
│   └── components/
│       ├── layout/                   # Sidebar, header
│       └── shared/                   # TanstackTable reuse
└── package.json
```

---

## Planned screens

### Dashboard (`/`)

- Counts: users, active products, pending orders, open disputes, open enquiries
- Recent orders list
- **API deps:** aggregate endpoints or multiple parallel queries (Phase 5)

### Users (`/users`)

| Screen | Features | API (Phase 5) |
| ------ | -------- | --------------- |
| List | Pagination, search by email/name, role filter | `GET /users?search=` |
| Detail | Profile, last login, cart contents, order history, listed products | `GET /users/:id` |
| Actions | Change role, delist seller, reactivate seller, delete user | Existing + new PATCH routes |

### Products (`/products`)

| Feature | API |
| ------- | --- |
| List all with status filter | `GET /products/admin` (new) or extend existing |
| Approve pending verification | `PATCH /products/:id/status` |
| Ban product | `PATCH /products/:id/status` → BANNED_BY_ADMIN |
| View encrypted fields | Admin-only decrypt endpoint (new) |

### Orders (`/orders`)

| Feature | API |
| ------- | --- |
| List all paginated | `GET /orders/all` ✅ exists |
| View detail | `GET /orders/:id` |
| Manual status override | `PATCH /orders/:id/status` ✅ exists |
| Trigger fulfillment retry | New admin endpoint (Phase 5) |

### Enquiries (`/enquiries`)

| Feature | API |
| ------- | --- |
| List all | `GET /enquiries` ✅ exists |
| Close | `PATCH /enquiries/:id/close` ✅ exists |
| Delete | `DELETE /enquiries/:id` ✅ exists |

### Disputes (`/disputes`)

| Feature | API (Phase 5) |
| ------- | ------------- |
| List with status filter | `GET /disputes` |
| View detail + order context | `GET /disputes/:id` |
| Resolve (buyer/seller/close) | `PATCH /disputes/:id/status` |
| Adjust frozen wallet on resolve | Wallet API |

### Game categories (`/categories`)

| Feature | API (Phase 5) |
| ------- | ------------- |
| CRUD categories | `/game-categories` |
| Toggle restricted | `PATCH /game-categories/:id/restrict` |

### Wallets / payouts (`/wallets`)

| Feature | API (Phase 5) |
| ------- | ------------- |
| List sellers with balances | `GET /wallets` |
| Record manual payout | `POST /wallets/:sellerId/payout` |
| View ledger history | `GET /wallets/:sellerId/ledger` |

---

## Tech stack (recommended)

Match nextjs-app for consistency:

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- Redux Toolkit + RTK Query
- `@smurfelite/types`
- `@tanstack/react-table` (reuse from nextjs-app)
- react-toastify

---

## Scaffold checklist (Phase 7.1)

- [ ] `pnpm create next-app` or copy nextjs-app skeleton stripped to admin needs
- [ ] Add to root `package.json` workspaces
- [ ] Add turbo pipeline entry
- [ ] Configure `@smurfelite/types` dependency
- [ ] Copy/adapt `baseApi.ts` with auth header injection
- [ ] ADMIN role guard middleware or layout check
- [ ] Separate port in dev (e.g. 3001): `"dev": "next dev -p 3001"`

---

## API dependencies (must exist before UI)

From [feature-roadmap.md](./feature-roadmap.md) Phase 5:

| Priority | API |
| -------- | --- |
| P0 | User search + detail |
| P0 | Seller delist/reactivate |
| P0 | Dispute CRUD + admin list |
| P0 | Game category CRUD |
| P1 | Wallet admin + payout |
| P1 | Product admin list with all statuses |
| P2 | Dashboard aggregates |

Many admin actions already have partial backend support (`GET /orders/all`, `GET /enquiries`, user role PATCH).

---

## UI patterns to reuse from nextjs-app

- `components/shared/TanstackTable` — data tables
- `components/shared/Button`
- Auth slice + token refresh flow
- Login form structure

---

## Environment variables

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_EXPRESS_SERVER_API` | API base URL |
| `NEXT_PUBLIC_APP_URL` | Admin app URL for redirects |

---

## Related docs

- [express-server.md](./express-server.md) — existing admin-capable routes
- [seller-app.md](./seller-app.md) — complementary seller portal
- [feature-roadmap.md](./feature-roadmap.md) — Phase 7 tasks
