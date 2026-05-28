# seller-app

Seller portal for listing and managing game accounts.

**Path:** `apps/seller-app`  
**Roadmap:** Phase 6 (shipped) → **Phase 10.7** (auth & seller approval UX)
**Stack:** Vite + React 19 + TypeScript + Tailwind + TanStack Router + TanStack Table + Redux Toolkit + RTK Query + redux-persist + `@smurfelite/ui`

---

## Purpose

- Sellers manage product listings (create, edit, publish, delist)
- Read-only sales, wallet balances, and disputes
- No dashboard in v1 — default route is `/products`
- Payouts are manual by admin — wallet is read-only (no withdraw button)

---

## Access control

- All routes except `/login` require `Role.SELLER` JWT
- BUYER/ADMIN tokens: logout + toast (“Seller account required. Contact support.”)
- Product mutations scoped to `sellerId === currentUser.id` (API + `verifySeller`)

**Onboarding (Phase 10):**

```mermaid
flowchart LR
  BuyerReg[Register as BUYER on nextjs-app]
  SelfApply[POST /auth/seller/apply]
  AdminInvite[Admin POST /sellers invite]
  Pending[PENDING approval]
  Approved[APPROVED]
  Storefront[Listings visible on nextjs-app]
  BuyerReg --> SelfApply
  AdminInvite --> Pending
  SelfApply --> Pending
  Pending -->|admin approve| Approved
  Approved --> Storefront
```

- Self-apply or admin invite → `sellerApprovalStatus: PENDING`
- Seller portal login allowed while pending (`POST /auth/seller/login`, `actingAs: SELLER`)
- Storefront listings require `APPROVED` (Phase 10.5.4)
- Sellers can shop on nextjs-app via `POST /auth/buyer/login` (`actingAs: BUYER`, DB role stays `SELLER`)

---

## Tech stack

| Layer | Choice |
| ----- | ------ |
| Build | Vite 6 + `@vitejs/plugin-react` |
| Router | `@tanstack/react-router` |
| Tables | `@tanstack/react-table` via `@smurfelite/ui` |
| State | RTK + RTK Query + redux-persist (encrypted auth) |
| OAuth | `@react-oauth/google` → `POST /auth/google` |
| Types | `@smurfelite/types` |

**Dev port:** `5174` (`pnpm dev:seller`)

---

## Environment variables

| Variable | Purpose |
| -------- | ------- |
| `VITE_EXPRESS_SERVER_API` | API base, e.g. `http://localhost:8080/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `VITE_APP_NAME` | Branding in shell header |

---

## Folder structure

```
apps/seller-app/
├── src/
│   ├── routes/                 # TanStack Router file routes
│   │   ├── __root.tsx
│   │   ├── login.tsx
│   │   ├── _authenticated.tsx
│   │   ├── _authenticated/products/
│   │   ├── _authenticated/products/new.tsx
│   │   ├── _authenticated/products/$id.edit.tsx
│   │   ├── _authenticated/sales.tsx
│   │   ├── _authenticated/wallet.tsx
│   │   └── _authenticated/disputes.tsx
│   ├── api/                    # RTK Query injectEndpoints
│   ├── store/
│   └── main.tsx
├── index.html
└── package.json
```

---

## Routes & features

| Route | Features | API |
| ----- | -------- | --- |
| `/` | Redirect → `/products` | — |
| `/login` | Email/password + Google; SELLER gate | `/auth/seller/login` (Phase 10), `/auth/google` |
| `/apply` | Seller registration / upgrade to PENDING | `POST /auth/seller/apply` (Phase 10.7) |
| `/products` | Table, status/search filters, publish/delist/reactivate/delete | `GET /products/mine` |
| `/products/new` | Create form, publish immediately checkbox | `POST /products`, `GET /game-categories` |
| `/products/:id/edit` | Edit metadata; optional credential replace | `GET/PUT /products/:id` |
| `/sales` | Read-only sales table + detail drawer | `GET /orders/seller` |
| `/wallet` | Balance cards + ledger table | `GET /wallets/me`, `GET /wallets/me/ledger` |
| `/disputes` | Read-only list + detail drawer | `GET /disputes/mine` |

**Sidebar nav:** Products, Sales, Wallet, Disputes, Logout.

---

## Product status workflow (seller view)

```mermaid
stateDiagram-v2
  [*] --> DRAFT: POST products
  DRAFT --> ACTIVE: publish
  ACTIVE --> DELISTED_BY_SELLER: seller delist
  DELISTED_BY_SELLER --> ACTIVE: reactivate
  ACTIVE --> SOLD: order fulfilled
  ACTIVE --> BANNED_BY_ADMIN: admin ban
  BANNED_BY_ADMIN --> ACTIVE: admin lift ban
```

No `PENDING_VERIFICATION` UI — self-publish only (Phase 5.1). **Phase 10:** publish allowed in portal while pending, but public storefront hides listings until seller is **approved**.

---

## Product form fields

Aligned with `CreateProductRequest`:

- Game category (non-restricted categories only)
- Title, description, price
- Specifications (key/value → JSON)
- Image URL
- Account credentials (required on create; never shown again after save)
- Optional: publish immediately (`publish: true`)

---

## API dependencies

| Endpoint | Phase |
| -------- | ----- |
| `POST /products`, `PUT /products/:id`, `PATCH` publish/delist/reactivate, `DELETE` | 5.1 ✅ |
| `GET /products/mine` | 5.10 |
| `GET /orders/seller` | 5.10 |
| `GET /wallets/me`, `GET /wallets/me/ledger` | 5.6, 5.10 |
| `GET /disputes/mine` | 5.5 ✅ |
| `GET /game-categories` | 5.2 ✅ |

---

## Out of scope (v1)

- Dashboard / KPI home page
- Seller withdraw or payout requests
- `PENDING_VERIFICATION` submission
- S3 image upload (URL string only)
- E2E Playwright (API smoke covers backend)

---

## Phase 10 checklist

See [feature-roadmap.md](./feature-roadmap.md) §10.7 — split seller login, apply flow, pending-approval banner.

---

## Related docs

- [admin-app.md](./admin-app.md) — approves sellers (Phase 10), records payouts
- [feature-roadmap.md](./feature-roadmap.md) — Phase 6 + Phase 10 checklists
- [express-server.md](./express-server.md) — API reference
