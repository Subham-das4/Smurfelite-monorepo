# nextjs-app

Buyer-facing storefront. Next.js 16 App Router + React 19 + Redux Toolkit + RTK Query.

**Path:** `apps/nextjs-app`  
**Package:** `nextjs-app`  
**Roadmap phases:** 2, 4 (primary); consumes APIs from Phase 5

---

## Purpose

- Browse and filter game account listings
- Product detail with similar accounts (gameType filter today)
- Cart management synced with API
- Checkout flow (shipping → payment)
- Order history UI (currently mock)
- Auth via modal (login/register/Google)
- Contact/enquiry form on homepage

---

## Folder map

```
apps/nextjs-app/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── page.tsx            # Home
│   │   ├── products/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   └── privacy-policy/
│   ├── api/                    # RTK Query endpoints
│   │   ├── baseApi.ts
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── cart.ts
│   │   ├── orders.ts
│   │   ├── payments.ts
│   │   ├── enquiries.ts
│   │   └── user.ts
│   ├── components/
│   │   ├── pages/              # Feature components
│   │   └── shared/             # Button, Carousel, Provider, etc.
│   ├── store/
│   │   └── reducers/           # auth, cart, user slices
│   ├── hooks/
│   └── lib/                    # checkoutSyntheticLines, addToCartFeedback
└── public/                     # Static assets
```

---

## Routes & pages

| Route | Type | Data source | Status |
| ----- | ---- | ----------- | ------ |
| `/` | SSR/Static | Static + Contact form | ✅ |
| `/products` | SSR | `fetch()` → `GET /products` | ✅ Real API |
| `/products/[productId]` | SSR | `GET /products/:id` + similar query | ✅ Real API |
| `/cart` | Client | RTK `useGetCartQuery` | ✅ Real API |
| `/checkout` | Client | Cart + order + payment mutations | ⚠️ Partial |
| `/checkout/[productId]` | Client | Buy-now scoped checkout | ⚠️ Partial |
| `/checkout/success` | Client | Polls order by query `orderId` | ⚠️ Partial |
| `/checkout/cancel` | Client | Static message only | ❌ No cancel API |
| `/orders` | SSR | **Hardcoded mock array** | ❌ Mock |
| `/privacy-policy` | Static | — | ✅ |

---

## API integration (RTK Query)

Base URL from `NEXT_PUBLIC_EXPRESS_SERVER_API` (see `baseApi.ts`).

| API file | Endpoints used | Wired in UI |
| -------- | -------------- | ----------- |
| `auth.ts` | login, register, google, refresh, logout | ✅ Login modal |
| `products.ts` | list, getById, create, update, delete | ✅ Browse/detail; CRUD unused in UI |
| `cart.ts` | get, add, remove | ✅ Cart page, header badge |
| `orders.ts` | create, getMine, getById, cancel, credentials | ⚠️ Checkout only; orders page mock |
| `payments.ts` | nowpayments invoice, paypal (unused) | ✅ Checkout crypto |
| `enquiries.ts` | send, getMine | ⚠️ Contact form (broken payload) |
| `user.ts` | getMe, updateMe | ✅ Profile slice |

---

## State management

| Slice | Purpose |
| ----- | ------- |
| `auth` | isAuthenticated, tokens, login modal |
| `cart` | Items synced from API on load/mutations |
| `user` | Profile from `GET /users/me` |

Redux persist with encryption for auth tokens.

---

## Checkout flow (current)

```mermaid
sequenceDiagram
  participant User
  participant Checkout as CheckoutContent
  participant API as express-server
  participant NP as NOWPayments

  User->>Checkout: Step 1 Shipping (local state)
  User->>Checkout: Step 2 Pay crypto
  Checkout->>API: POST /orders
  Checkout->>API: POST /payments/nowpayments/create-invoice
  Checkout->>Checkout: clearCart Redux only
  Checkout->>NP: Redirect invoiceUrl
```

**Problems:**
- Shipping never sent to backend
- Cart cleared before payment confirmed
- Server cart not cleared on full-cart path
- No bypass mode for local E2E

**Planned (Phase 2):** Bypass path, deferred cart clear, wire cancel page.

---

## Mock / stub UI

| Location | What's mocked |
| -------- | --------------- |
| `app/orders/page.tsx` | Entire order list (12 fake orders) |
| `components/pages/products/detail/data.ts` | Reviews, seller stats |
| `CheckoutOrderSummary.tsx` | Promo code (no backend) |
| `PaymentForm.tsx` | PayPal, card, Skrill disabled; crypto only |

---

## Auth UX

- Login/register modal in header (not separate routes)
- Google OAuth via `@react-oauth/google`
- Unauthenticated add-to-cart opens login modal
- Checkout requires auth (opens modal if not logged in)

**Gaps:** No role-specific routing (all users use same site). Seller/admin will use separate apps.

---

## Key components

| Component | Path | Notes |
| --------- | ---- | ----- |
| `ProductsGrid` | `components/pages/products/` | Pagination, add to cart |
| `FilterSidebar` | `components/pages/products/` | URL-driven filters |
| `ProductPurchaseCard` | `detail/` | Buy now + add to cart |
| `SimilarProducts` | `detail/` | Same gameType API query |
| `CartContent` | `components/pages/cart/` | Line items + summary |
| `CheckoutContent` | `components/pages/checkout/` | Main checkout orchestrator |
| `OrdersContent` | `components/pages/orders/` | Table + filters (mock data) |
| `Contact` | `components/pages/home/` | Enquiry form |

---

## Environment variables

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_EXPRESS_SERVER_API` | Client-side API base URL |
| `EXPRESS_SERVER_API` | Server-side fetch (products SSR) |

**Planned:**
- `NEXT_PUBLIC_TAWK_PROPERTY_ID` — livechat (Phase 4)
- `NEXT_PUBLIC_PAYMENT_BYPASS` — optional UI hint

---

## Scripts

```bash
pnpm --filter=nextjs-app dev
pnpm --filter=nextjs-app build
```

---

## Planned work (this app)

### Phase 2
- [ ] Wire orders page to real API
- [ ] Fix checkout cart timing
- [ ] Payment bypass integration
- [ ] Cancel page → cancel order API

### Phase 4
- [ ] Tawk.to script in layout
- [ ] Dispute form from orders page
- [ ] Credentials viewer for completed orders
- [ ] Remove mock reviews

---

## Dependencies

- `@smurfelite/types` — shared interfaces
- `express-server` — all data via REST

---

## Related docs

- [express-server.md](./express-server.md) — API reference
- [feature-roadmap.md](./feature-roadmap.md) — Phases 2, 4
- [issues.md](./issues.md) — ISS-001 through ISS-013
