# SmurfElite Issues Tracker

Prioritized list of known bugs, gaps, and technical debt. Update this file as issues are fixed or new ones are discovered.

**Legend:** 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low

---

## Open issues

### 🔴 ISS-003 — Checkout clears cart before payment confirmation

| Field | Value |
| ----- | ----- |
| **Severity** | Critical |
| **Area** | Cart / Checkout |
| **Phase fix** | Phase 2 |

**Problem:** On cart checkout, Redux `clearCart()` runs before redirect to NOWPayments. If buyer abandons payment, UI shows empty cart while order stays `PENDING` and products remain `transactionBlock: true`.

**Files:**
- `apps/nextjs-app/src/components/pages/checkout/index.tsx`

**Suggested fix:** Defer cart clearing until payment success (IPN or bypass completion). On cancel/expiry, restore cart or show "resume order" UX.

---

### 🔴 ISS-004 — Server cart not cleared on full-cart checkout

| Field | Value |
| ----- | ----- |
| **Severity** | Critical |
| **Area** | Cart |
| **Phase fix** | Phase 2 |

**Problem:** Buy-now path calls `removeFromCartApi` per product; full-cart path only clears Redux. Server cart items persist after checkout.

**Files:**
- `apps/nextjs-app/src/components/pages/checkout/index.tsx`
- `apps/express-server/src/modules/cart/cart.service.ts`

**Suggested fix:** Clear server cart after successful payment (or add `DELETE /cart` bulk endpoint).

---

### 🔴 ISS-005 — No order fulfillment pipeline

| Field | Value |
| ----- | ----- |
| **Severity** | Critical |
| **Area** | Orders |
| **Phase fix** | Phase 2 |

**Problem:** NOWPayments IPN only moves order to `PROCESSING`. Nothing transitions to `COMPLETED`, marks products sold, or delivers credentials via email.

**Files:**
- `apps/express-server/src/modules/payments/nowpayments/nowpayments.service.ts`
- `apps/express-server/src/modules/orders/orders.services.ts`

**Suggested fix:** Add fulfillment service: `PROCESSING → COMPLETED`, set product `isAvailable: false` / `ProductStatus.SOLD`, send credentials email.

---

### 🔴 ISS-006 — No payment bypass for local E2E testing

| Field | Value |
| ----- | ----- |
| **Severity** | Critical |
| **Area** | Payment |
| **Phase fix** | Phase 2 |

**Problem:** Full checkout requires NOWPayments sandbox + public HTTPS tunnel (ngrok). No dev shortcut per prompt.md requirement.

**Files:**
- `apps/express-server/src/modules/payments/` (new bypass module)
- `apps/nextjs-app/src/components/pages/checkout/index.tsx`

**Suggested fix:** Add `PAYMENT_BYPASS=true` env; skip invoice redirect and auto-complete order flow.

---

### 🟠 ISS-007 — No payment failure / expiry handling

| Field | Value |
| ----- | ----- |
| **Severity** | High |
| **Area** | Payment / Orders |
| **Phase fix** | Phase 2 + Phase 8 |

**Problem:** IPN ignores non-`finished` statuses. Stale `PENDING` orders never auto-cancel; `transactionBlock` never released on timeout.

**Files:**
- `apps/express-server/src/modules/payments/nowpayments/nowpayments.service.ts`

**Suggested fix:** Handle failed/expired IPN; cron job to cancel orders older than N minutes and release locks.

---

### 🟠 ISS-008 — Product model missing status lifecycle

| Field | Value |
| ----- | ----- |
| **Severity** | High |
| **Area** | Products |
| **Phase fix** | Phase 1 |

**Problem:** No `ProductStatus` enum (Draft, Active, Pending Verification, Sold, Delisted_By_Seller, Banned_By_Admin). Only `isAvailable` boolean and hard delete.

**Files:**
- `apps/express-server/prisma/schema.prisma`
- `apps/express-server/src/modules/product/product.service.ts`

**Suggested fix:** Add enum + migration; filter listings by status; soft-delete instead of hard delete where appropriate.

---

### 🟠 ISS-009 — Auth emails not sent

| Field | Value |
| ----- | ----- |
| **Severity** | High |
| **Area** | Auth / Email |
| **Phase fix** | Phase 3 |

**Problem:** Verification and password-reset tokens are logged to console, not emailed (`TODO` in auth.service.ts).

**Files:**
- `apps/express-server/src/modules/auth/auth.service.ts`

**Suggested fix:** Implement email module; send via help@ sender.

---

### 🟠 ISS-010 — Register endpoint allows role escalation

| Field | Value |
| ----- | ----- |
| **Severity** | High |
| **Area** | Auth |
| **Phase fix** | Phase 5 |

**Problem:** `registerSchema` accepts optional `role: ADMIN | SELLER | BUYER`. Public registration could create admin accounts.

**Files:**
- `apps/express-server/src/schemas/auth.schemas.ts`
- `apps/express-server/src/modules/auth/auth.service.ts`

**Suggested fix:** Force `BUYER` on public register; admin promotes roles via admin API only.

---

### 🟠 ISS-011 — Cancel checkout page does not cancel order

| Field | Value |
| ----- | ----- |
| **Severity** | High |
| **Area** | Checkout |
| **Phase fix** | Phase 2 |

**Problem:** `/checkout/cancel?orderId=...` is informational only. Does not call `PATCH /orders/:id/cancel`.

**Files:**
- `apps/nextjs-app/src/app/checkout/cancel/CheckoutCancelContent.tsx`

**Suggested fix:** Auto-cancel or prompt user to cancel pending order on landing.

---

### 🟡 ISS-014 — Similar products use gameType filter only

| Field | Value |
| ----- | ----- |
| **Severity** | Medium |
| **Area** | Products |
| **Phase fix** | Phase 5 |

**Problem:** "Similar" = same `gameType` query, not vector similarity. Decision: implement pgvector embeddings.

**Files:**
- `apps/nextjs-app/src/app/products/[productId]/page.tsx`

**Suggested fix:** Add embedding column + vector search endpoint; backfill via cron.

---

### 🟡 ISS-015 — Promo codes are UI-only stub

| Field | Value |
| ----- | ----- |
| **Severity** | Medium |
| **Area** | Checkout |
| **Phase fix** | Future |

**Problem:** `CheckoutOrderSummary` has promo input but discounts don't affect `order.totalAmount`.

**Files:**
- `apps/nextjs-app/src/components/pages/checkout/CheckoutOrderSummary.tsx`

---

### 🟡 ISS-016 — PayPal integration disabled but code remains

| Field | Value |
| ----- | ----- |
| **Severity** | Medium |
| **Area** | Payment |
| **Phase fix** | Phase 9 |

**Problem:** PayPal routes commented out in `route.ts`; frontend still has RTK mutations.

**Files:**
- `apps/express-server/src/lib/route.ts`
- `apps/nextjs-app/src/api/payments.ts`

---

### 🟡 ISS-017 — No lastLoginAt on User

| Field | Value |
| ----- | ----- |
| **Severity** | Medium |
| **Area** | Users |
| **Phase fix** | Phase 1 |

**Problem:** Admin cannot view last login per prompt requirement.

**Files:**
- `apps/express-server/prisma/schema.prisma`

---

### 🟡 ISS-018 — User admin list has no search

| Field | Value |
| ----- | ----- |
| **Severity** | Medium |
| **Area** | Users |
| **Phase fix** | Phase 5 |

**Problem:** `GET /users` paginates but no email/name search filter.

**Files:**
- `apps/express-server/src/modules/user/user.service.ts`

---

### 🟢 ISS-019 — Stripe service file is empty placeholder

| Field | Value |
| ----- | ----- |
| **Severity** | Low |
| **Area** | Payment |
| **Phase fix** | Future / remove |

**Files:**
- `apps/express-server/src/modules/payments/stripe/stripe.service.ts`

---

### 🟢 ISS-020 — Service fee is zero everywhere

| Field | Value |
| ----- | ----- |
| **Severity** | Low |
| **Area** | Pricing |
| **Phase fix** | When business rules defined |

**Files:**
- `packages/shared-types/pricing.ts`
- `apps/express-server/src/constants/order-pricing.ts`

---

### 🟢 ISS-021 — paymentIntent field overloaded

| Field | Value |
| ----- | ----- |
| **Severity** | Low |
| **Area** | Payment |
| **Phase fix** | Phase 9 |

**Problem:** Stores invoice ID then payment ID on IPN; no separate fields.

**Files:**
- `apps/express-server/prisma/schema.prisma`
- `apps/express-server/src/modules/payments/nowpayments/nowpayments.service.ts`

---

## Missing features (not bugs — tracked in roadmap)

These are required by prompt.md but not yet built:

- Dispute management (schema, API, admin UI)
- Seller wallet (pending / withdrawable / freeze)
- Game category admin (restricted flag)
- Seller delist / reactivate cascade
- Admin app (`apps/admin-app`)
- Seller app (`apps/seller-app`)
- Cron server (`apps/cron-server`)
- Tawk.to livechat embed
- Multi-sender email (finance@, help@, purchase@)
- pgvector similar products

See [feature-roadmap.md](./feature-roadmap.md).

---

## Resolved issues

### ✅ ISS-002 — Orders page uses mock data (2026-05-28, Phase 2.4)

`OrdersContent` uses `useGetMyOrdersQuery` with auth skip/CTA; five API status badges and filters; cancel via `useCancelOrderMutation` (PENDING); credentials modal for COMPLETED; minimal `/orders/[orderId]` detail page.

### ✅ ISS-001 — Enquiry API contract mismatch (2026-05-27, Phase 3.3)

Guest contact form aligned with backend: `Enquiry` model stores `name`, `email`, `phone`; `POST /enquiries` is public with optional auth; help@ notification email on create.

### ✅ ISS-013 — Product detail mock reviews (2026-05-27, Phase 4.3)

Mock reviews removed from `detail/data.ts`; `ReviewsPanel` gated by `PRODUCT_REVIEWS_ENABLED = false`; live product page uses API data only.

### ✅ ISS-012 — Shipping data not persisted (2026-05-27, Phase 4.4)

Shipping step removed from checkout for digital-only delivery; single payment step with availability checks before order creation.

When fixing an issue, move it here with date and PR reference.
