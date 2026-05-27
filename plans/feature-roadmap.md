# SmurfElite Feature Roadmap

Master checklist for all features from [prompt.md](../prompt.md). Tasks are grouped into phases so independent modules ship before dependents.

**How to use:** Check off tasks as completed. Each task should map to a small, reviewable PR.

---

## Phase 0 — Documentation

- [x] Audit codebase vs prompt.md requirements
- [x] Create `plans/` folder structure
- [x] Write app summaries and issues tracker
- [x] Define phased roadmap (this file)

---

## Phase 1 — Schema & shared foundations

Prerequisite for wallet, disputes, product lifecycle, and vector search.

### 1.1 Prisma schema extensions

- [x] Add `ProductStatus` enum: `DRAFT`, `ACTIVE`, `PENDING_VERIFICATION`, `SOLD`, `DELISTED_BY_SELLER`, `BANNED_BY_ADMIN`
- [x] Add `status ProductStatus @default(DRAFT)` on `Product`
- [x] Add `sellerDelisted Boolean @default(false)` on `Product` (admin delist cascade)
- [x] Add `deletedAt DateTime?` for soft delete (optional, vs status-only)
- [x] Replace or supplement `isAvailable` with status-driven availability logic
- [x] Add `lastLoginAt DateTime?` on `User`
- [x] Add `GameCategory` model: `id`, `name`, `slug`, `isRestricted`, `createdAt`
- [x] Link `Product.gameType` to `GameCategory` (FK or validated slug) — migration strategy
- [x] Add `Dispute` model: order ref, buyer, seller, status, reason, details JSON, createdAt
- [x] Add `DisputeStatus` enum: `OPEN`, `UNDER_REVIEW`, `RESOLVED_BUYER`, `RESOLVED_SELLER`, `CLOSED`
- [x] Add `SellerWallet` model: `userId`, `pendingBalance`, `availableBalance`, `frozenBalance`
- [x] Add `WalletLedger` model: type, amount, orderId?, disputeId?, note, createdAt
- [x] Add `PaymentStatus` enum on Order or separate fields: `PENDING`, `PAID`, `FAILED`, `REFUNDED`
- [ ] Enable PostgreSQL `pgvector` extension in migration *(optional SQL: `migrations/optional_pgvector_embedding.sql` — requires pgvector on PostgreSQL host)*
- [ ] Add `embedding vector(1536)?` on `Product` *(deferred until pgvector extension installed)*
- [x] Run `prisma migrate dev` and regenerate client

### 1.2 Shared types

- [x] Export new enums from `@smurfelite/types`
- [x] Add DTOs: `GameCategoryResponse`, `DisputeResponse`, `WalletResponse`, `WalletLedgerEntry`
- [x] Add `ProductStatus` to `ProductListItem` / create/update requests
- [x] Document breaking changes in `plans/shared-types.md`

### 1.3 Express scaffolding (no full UI yet)

- [x] Create placeholder modules: `game-category/`, `dispute/`, `wallet/` (empty routes OK)
- [x] Update product listing filter to respect `ProductStatus.ACTIVE` + `!sellerDelisted`

**Depends on:** Nothing  
**Unblocks:** Phase 2, 5, 6, 7, 8

---

## Phase 2 — Payment bypass & order lifecycle (E2E unblock)

Priority: get full buyer journey working without NOWPayments.

### 2.1 Payment bypass

- [x] Add `PAYMENT_BYPASS` env var to `.env.example`
- [x] Create `payments/bypass/bypass.service.ts` — simulate payment success
- [x] Add `POST /payments/bypass/complete` (auth + owns order + PENDING only)
- [x] When bypass enabled, checkout calls bypass instead of NOWPayments invoice
- [x] Bypass flow: `PENDING → COMPLETED` with `paymentStatus: PAID` in one transaction

### 2.2 Order fulfillment

- [x] Create `orders/fulfillment.service.ts`
- [x] On completion: set order `COMPLETED`, products `SOLD` / unavailable
- [x] Release or finalize `transactionBlock` appropriately
- [ ] Decrypt credentials and prepare email payload (send deferred to Phase 3 if needed)
- [x] Write seller wallet `pendingBalance` credit on completion

### 2.3 Cart & checkout fixes

- [x] Do not clear Redux cart until payment/bypass success
- [x] Clear server cart items after successful order completion
- [x] Add `DELETE /cart` or clear-all helper endpoint
- [x] Cancel page: call cancel API when `orderId` query present and order is PENDING
- [x] Success page: poll order status until COMPLETED (bypass) or PROCESSING (real payment)

### 2.4 Orders UI wiring

- [ ] Replace mock data in `orders/page.tsx` with `useGetMyOrdersQuery`
- [ ] Map `OrderResponse` to orders table UI types
- [ ] Wire cancel order action to `PATCH /orders/:id/cancel`
- [ ] Show real status badges (PENDING, PROCESSING, COMPLETED, CANCELLED, REFUNDED)
- [ ] Add "View credentials" for COMPLETED orders (`GET /orders/:id/credentials`)

### 2.5 Order expiry (minimal — full cron in Phase 8)

- [x] Define `ORDER_PENDING_TIMEOUT_MINUTES` env default (e.g. 30)
- [x] Document manual cancel flow until cron exists
- [x] Optional: inline expiry check on order fetch

**Depends on:** Phase 1 (ProductStatus, wallet)  
**Unblocks:** Phase 4, 6, 7  
**Fixes issues:** ISS-002, ISS-003, ISS-004, ISS-005, ISS-006, ISS-011

---

## Phase 3 — Email infrastructure

### 3.1 SMTP module

- [ ] Add `nodemailer` dependency
- [ ] Create `services/email.service.ts` with shared SMTP transport
- [ ] Env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- [ ] Env per sender: `EMAIL_FINANCE_ADDRESS`, `EMAIL_FINANCE_NAME`, etc.
- [ ] Env: `EMAIL_HELP_*`, `EMAIL_PURCHASE_*` (address + display name each)
- [ ] Helper: `sendEmail({ from: 'purchase' | 'help' | 'finance', to, subject, html })`

### 3.2 Wire transactional emails

- [ ] Send verification email on register (help@)
- [ ] Send password reset email (help@)
- [ ] Send purchase credentials email on order COMPLETED (purchase@)
- [ ] HTML templates for each email type

### 3.3 Enquiry fix

- [ ] Decide: guest enquiry (extend schema) vs authenticated-only
- [ ] Align `EnquiryPayload`, Zod schema, Prisma model, Contact form
- [ ] Store name/email/phone if guest flow chosen
- [ ] Send notification email to help@ on new enquiry

**Depends on:** Phase 2 (fulfillment trigger)  
**Fixes issues:** ISS-001, ISS-009

---

## Phase 4 — Buyer site polish

### 4.1 Livechat

- [ ] Add Tawk.to property ID to env (`NEXT_PUBLIC_TAWK_PROPERTY_ID`)
- [ ] Embed script in `nextjs-app` root layout
- [ ] Verify widget loads on home, products, checkout

### 4.2 Disputes (buyer-facing)

- [ ] API: `POST /disputes` with orderId + details (Phase 5 backend)
- [ ] Orders page: "Open dispute" action for COMPLETED orders
- [ ] Dispute form with order + item details pre-filled

### 4.3 Product detail cleanup

- [ ] Remove or clearly label mock reviews in `detail/data.ts`
- [ ] Hide reviews panel until real review system exists

### 4.4 Checkout UX

- [ ] Decide fate of shipping step (remove or persist) — see ISS-012
- [ ] Payment method UI: show "Test mode" when bypass enabled
- [ ] Error handling for unavailable products mid-checkout

**Depends on:** Phase 2, Phase 3 (partial), Phase 5 (dispute API)  
**Fixes issues:** ISS-013

---

## Phase 5 — Express API completion

### 5.1 Products

- [ ] `POST /products` — default status DRAFT or PENDING_VERIFICATION
- [ ] Admin endpoint: approve product → ACTIVE
- [ ] Seller endpoint: publish draft → PENDING_VERIFICATION or ACTIVE
- [ ] Mark sold on fulfillment (automatic)
- [ ] Seller delist own product → DELISTED_BY_SELLER
- [ ] Admin ban product → BANNED_BY_ADMIN
- [ ] Soft delete / delist vs hard delete policy
- [ ] Filter public listing: ACTIVE + seller not delisted + category not restricted

### 5.2 Game categories (admin API)

- [ ] CRUD `GET/POST/PATCH/DELETE /game-categories`
- [ ] `PATCH /game-categories/:id/restrict` toggle
- [ ] Block new listings in restricted categories

### 5.3 Seller delist / reactivate (admin API)

- [ ] `PATCH /users/:id/delist` — set seller flag, cascade `sellerDelisted` on products
- [ ] `PATCH /users/:id/reactivate` — clear flag, restore product visibility
- [ ] Hide delisted seller products from public listing

### 5.4 Users (admin API)

- [ ] `GET /users?search=&page=` — email/name search
- [ ] `GET /users/:id` — detail with cart, orders, products, lastLoginAt
- [ ] `GET /users/:id/products` — seller listings

### 5.5 Disputes (full API)

- [ ] `POST /disputes` — buyer creates from order
- [ ] `GET /disputes/mine` — buyer/seller view
- [ ] `GET /disputes` — admin list with filters
- [ ] `PATCH /disputes/:id/status` — admin resolve
- [ ] On dispute open: freeze wallet amount linked to order

### 5.6 Wallet

- [ ] Auto-create wallet on seller registration / first sale
- [ ] Credit `pendingBalance` on order COMPLETED
- [ ] Admin: `POST /wallets/:sellerId/payout` — move available → paid (manual record)
- [ ] Admin: adjust frozen balance on dispute resolution
- [ ] `GET /wallets/me` — seller balance read

### 5.7 Similar products (pgvector)

- [ ] Embedding text builder from title + description + specifications
- [ ] OpenAI/local embedding provider abstraction
- [ ] `POST /products/:id/embed` — generate/store embedding
- [ ] `GET /products/:id/similar` — vector similarity search
- [ ] Fallback to gameType filter if no embedding

### 5.8 Auth hardening

- [ ] Remove public `role` from register schema; default BUYER only
- [ ] Update `lastLoginAt` on login success
- [ ] Seller registration flow via admin promote or dedicated endpoint

### 5.9 Payment status

- [ ] Separate or map `PaymentStatus` alongside `OrderStatus`
- [ ] IPN handlers update payment status (Phase 9)

**Depends on:** Phase 1  
**Unblocks:** Phase 6, 7, 8

---

## Phase 6 — Seller app (`apps/seller-app`)

### 6.1 Scaffold

- [ ] Create `apps/seller-app` Next.js workspace
- [ ] Add to root `package.json` workspaces + turbo pipeline
- [ ] Copy auth/RTK patterns from nextjs-app
- [ ] Env: `NEXT_PUBLIC_EXPRESS_SERVER_API`, seller-only branding

### 6.2 Auth & layout

- [ ] Login page (SELLER role required; redirect if BUYER)
- [ ] Protected layout + sidebar nav
- [ ] Logout, session refresh

### 6.3 Product management

- [ ] List my products with status filters
- [ ] Create product form (credentials encrypted server-side)
- [ ] Edit product (own listings only)
- [ ] Delist / republish actions
- [ ] Draft → submit for verification flow

### 6.4 Orders & wallet (read-only)

- [ ] View sales linked to my products (needs API: seller order items)
- [ ] Wallet dashboard: pending, available, frozen
- [ ] Disputes list (read-only)

**Depends on:** Phase 1, Phase 5 (product + wallet APIs)

---

## Phase 7 — Admin app (`apps/admin-app`)

### 7.1 Scaffold

- [ ] Create `apps/admin-app` Next.js workspace
- [ ] Turbo + shared types setup
- [ ] ADMIN role gate on all routes

### 7.2 Dashboard & users

- [ ] User list with search + pagination
- [ ] User detail: cart, orders, products, last login
- [ ] Change user role
- [ ] Delist / reactivate seller

### 7.3 Catalog

- [ ] All products list with status filters
- [ ] Approve pending verification products
- [ ] Ban / delist products
- [ ] Game category CRUD + restrict toggle

### 7.4 Operations

- [ ] All orders list
- [ ] Manual order status override
- [ ] Enquiries list + close
- [ ] Dispute management UI
- [ ] Manual seller payout recording

**Depends on:** Phase 5 APIs

---

## Phase 8 — Cron server (`apps/cron-server`)

### 8.1 Scaffold

- [ ] Create `apps/cron-server` Node package
- [ ] Share Prisma via `@smurfelite/types`
- [ ] Env: `DATABASE_URL`, job intervals, hold period days

### 8.2 Jobs

- [ ] **Wallet hold release:** move pending → available after N days
- [ ] **Order expiry:** cancel PENDING orders past timeout; release `transactionBlock`
- [ ] **Embedding backfill:** products missing embedding (optional, Phase 5 dependency)
- [ ] Structured logging + error alerting hooks

### 8.3 Deployment

- [ ] Document run command: `pnpm --filter cron-server start`
- [ ] Single-instance lock (advisory lock or leader election) to prevent duplicate runs

**Depends on:** Phase 1 schema, Phase 5 wallet logic  
**Fixes issues:** ISS-007 (with Phase 2)

---

## Phase 9 — Payment gateway (deferred)

After E2E passes with bypass.

### 9.1 NOWPayments hardening

- [ ] Handle IPN: failed, expired, refunded statuses
- [ ] Map to `PaymentStatus` + order cancel where appropriate
- [ ] Payment retry UI on orders page for PENDING orders
- [ ] Separate `invoiceId` vs `paymentId` fields on Order

### 9.2 Production readiness

- [ ] Document ngrok-free dev workflow vs bypass
- [ ] Production env checklist
- [ ] Idempotency tests for IPN

### 9.3 PayPal cleanup (optional)

- [ ] Re-enable or remove PayPal code paths
- [ ] Remove unused RTK mutations if dropped

**Depends on:** Phase 2 E2E validated

---

## Feature area quick reference

Map prompt.md requirements to phases:

| # | Feature area | Primary phase |
| - | ------------ | ------------- |
| 1 | Products | 1, 5, 6 |
| 2 | Cart | 2 (fixes) |
| 3 | Orders | 2, 3, 5 |
| 4 | Enquiry | 3, 5, 7 |
| 5 | Users | 1, 5, 7 |
| 6 | Authentication | 3, 5, 6, 7 |
| 7 | Admin | 5, 7 |
| 8 | Email | 3 |
| 9 | Payment | 2 (bypass), 9 (gateway) |
| 10 | Disputes | 1, 4, 5, 7 |
| 11 | Wallet & payouts | 1, 5, 6, 7, 8 |
| 12 | Livechat | 4 |
| 13 | Cron jobs | 8 |

---

## Suggested first implementation sprint

After Phase 0 (done), pick these for the first coding sprint:

1. Phase 1.1 — ProductStatus + wallet schema migration
2. Phase 2.1 — Payment bypass
3. Phase 2.2 — Fulfillment service
4. Phase 2.4 — Wire orders page
5. Phase 2.3 — Cart clearing fixes

This unlocks end-to-end buyer testing without external payment dependencies.
