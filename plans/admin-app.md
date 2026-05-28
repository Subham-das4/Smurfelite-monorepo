# admin-app

Internal admin panel for SmurfElite operations.

**Path:** `apps/admin-app`  
**Roadmap:** Phase 7 (shipped) → **Phase 10.6** (auth & governance)
**Stack:** Vite + React 19 + TypeScript + Tailwind + TanStack Router + TanStack Table + Redux Toolkit + RTK Query + redux-persist + `@smurfelite/ui`

---

## Purpose

- Manage users, sellers, products, orders
- Handle enquiries and disputes
- Configure game categories (including restricted)
- Delist/reactivate sellers
- Record manual seller payouts
- View decrypted credentials on **completed orders only** (not product-level)

No dashboard in v1 — default route is `/users`.

---

## Access control

- All routes except `/login`, `/forgot-password`, `/reset-password` require `Role.ADMIN` JWT
- BUYER/SELLER tokens: logout + clear error message
- **Phase 7 (current):** `POST /auth/login`, `POST /auth/google`, refresh flow
- **Phase 10.6 (planned):** `POST /auth/admin/login` only — no Google OAuth; admin password reset via `/auth/admin/forgot-password` and `/auth/admin/reset-password` (isolated from buyer reset)
- Admins are provisioned only via `POST /admins` (Phase 10.4) — not via user role dropdown
- Production: optional subdomain `admin.smurfelite.store`

**Dev port:** `5173` (`pnpm dev:admin`)

---

## Tech stack

Same as [seller-app.md](./seller-app.md). Shared UI from `packages/ui`.

---

## Environment variables

| Variable | Purpose |
| -------- | ------- |
| `VITE_EXPRESS_SERVER_API` | API base, e.g. `http://localhost:8080/api` |
| `VITE_APP_NAME` | Branding |

*`VITE_GOOGLE_CLIENT_ID` removed in Phase 10.6.1.*

---

## Folder structure

```
apps/admin-app/
├── src/
│   ├── routes/
│   │   ├── login.tsx
│   │   ├── _authenticated/
│   │   │   ├── users/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── enquiries.tsx
│   │   │   ├── disputes.tsx
│   │   │   ├── categories.tsx
│   │   │   └── wallets.tsx
│   ├── api/
│   └── store/
└── package.json
```

---

## Routes & features

| Route | Features | API |
| ----- | -------- | --- |
| `/` | Redirect → `/users` | — |
| `/login` | Email/password; ADMIN gate | `/auth/admin/login` (Phase 10) |
| `/forgot-password` | Request admin reset email | `/auth/admin/forgot-password` (Phase 10.6.3) |
| `/reset-password` | Set new password from email link | `/auth/admin/reset-password` (Phase 10.6.3) |
| `/admins` | List, add, remove admin accounts | `GET/POST/DELETE /admins` (Phase 10.6.2) |
| `/sellers` | Pending / approved / rejected queue; invite, approve, reject | `GET/POST /sellers`, `PATCH .../approve`, `PATCH .../reject` (Phase 10.6.4) |
| `/users` | Search, pagination, role badges | `GET /users` |
| `/users/:userId` | Profile, cart, orders, products; delist/reactivate/delete (no promote-admin/seller) | `GET /users/:id`, `PATCH` actions |
| `/products` | All statuses, filters, ban/lift-ban | `GET /products/admin` |
| `/products/:productId` | Read-only metadata; ban/lift-ban | `GET /products/:id`, `PATCH` ban |
| `/orders` | All orders paginated | `GET /orders/all` |
| `/orders/:orderId` | Detail, status override, **view credentials** (COMPLETED) | `GET/PATCH /orders/:id`, `GET .../credentials` |
| `/enquiries` | List, close, delete | `GET /enquiries`, `PATCH close`, `DELETE` |
| `/disputes` | List, resolve status | `GET /disputes`, `PATCH /disputes/:id/status` |
| `/categories` | CRUD + restrict toggle | `/game-categories` |
| `/wallets` | Seller balances, ledger drawer, record payout | `GET /wallets`, `POST .../payout` |

**Sidebar nav (Phase 7):** Users, Products, Orders, Enquiries, Disputes, Categories, Wallets, Logout.

**Sidebar nav (Phase 10):** add **Admins**, **Sellers**; remove promote-to-admin and promote-to-seller from user detail.

---

## Credentials policy

- **Allowed:** `GET /orders/:orderId/credentials` for ADMIN on COMPLETED orders (modal + copy)
- **Not allowed:** Decrypt credentials from product admin screens

---

## API dependencies

| Priority | Endpoint | Phase |
| -------- | -------- | ----- |
| P0 | User search + detail + seller actions | 5.3–5.4 ✅ |
| P0 | Disputes admin list + resolve | 5.5 ✅ |
| P0 | Game category CRUD | 5.2 ✅ |
| P0 | `GET /products/admin` | 5.10 |
| P0 | Admin order credentials | 5.10 |
| P1 | Wallet list + ledger + payout | 5.6, 5.10 |
| P1 | `GET /orders/all`, status override | ✅ |

---

## Phase 10 checklist

See [feature-roadmap.md](./feature-roadmap.md) §10.6 — admin auth cleanup, `/admins`, `/sellers`, password reset pages.

---

## Out of scope (v1)

- Dashboard / aggregate KPI APIs
- Product approval / `PENDING_VERIFICATION` queue (seller approval is user-level in Phase 10.5)
- Product-level credential decrypt
- Automated seller payouts
- Portal E2E Playwright

---

## Related docs

- [seller-app.md](./seller-app.md)
- [express-server.md](./express-server.md)
- [feature-roadmap.md](./feature-roadmap.md)
