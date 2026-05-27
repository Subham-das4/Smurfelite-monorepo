# express-server

Backend REST API for SmurfElite. Express + TypeScript + Prisma + PostgreSQL.

**Path:** `apps/express-server`  
**Package:** `@smurfelite/express-server`  
**Roadmap phases:** 1, 2, 3, 5, 9

---

## Purpose

- Authentication (JWT + refresh tokens, Google OAuth)
- Product catalog CRUD with encrypted credentials
- Cart, orders, payments
- User and enquiry management
- Admin-only routes (embedded in same API; consumed by future admin-app)

---

## Folder map

```
apps/express-server/
├── prisma/
│   └── schema.prisma          # Source of truth for DB schema
├── src/
│   ├── index.ts               # Express app entry
│   ├── lib/
│   │   ├── route.ts           # API router mount
│   │   └── prisma.ts          # Prisma client singleton
│   ├── modules/
│   │   ├── auth/              # Register, login, OAuth, tokens
│   │   ├── user/              # Profile + admin user mgmt
│   │   ├── product/           # Catalog CRUD
│   │   ├── cart/              # Buyer cart
│   │   ├── orders/            # Order lifecycle
│   │   ├── enquiry/           # Support tickets
│   │   ├── payments/
│   │   │   ├── nowpayments/   # Crypto invoices + IPN
│   │   │   ├── paypal/        # Commented out / disabled
│   │   │   └── stripe/        # Empty placeholder
│   │   └── logs/              # Log ingestion
│   ├── schemas/               # Zod validation
│   ├── services/
│   │   └── encryption.service.ts  # AES credential encryption
│   ├── constants/
│   │   └── order-pricing.ts   # ORDER_SERVICE_FEE_USD = 0
│   ├── types/
│   └── utils/
└── .env.example
```

---

## API routes (mounted at `/api`)

| Prefix | Auth | Description |
| ------ | ---- | ----------- |
| `GET /` | Public | Health / welcome |
| `/products` | Mixed | Public list/detail; create/update/delete need SELLER/ADMIN |
| `/auth` | Public | Register, login, OAuth, refresh, verify, reset |
| `/cart` | BUYER | Get, add, remove items |
| `/orders` | BUYER/ADMIN | Create, list, cancel, credentials |
| `/payments/nowpayments` | Mixed | Create invoice (auth), IPN webhook (public) |
| `/users` | Auth | Profile; admin list/role/delete |
| `/enquiries` | Auth | Create, list mine; admin list/close/delete |
| `/wallets` | Auth | Seller wallet (501 placeholder) |
| `/email` | Public | Email module status (`GET /status`) |
| `/logs` | — | Log endpoints |

### Products (`/products`)

| Method | Path | Role | Status |
| ------ | ---- | ---- | ------ |
| GET | `/` | Public | ✅ Pagination, filters (gameType, price, search, sort) |
| GET | `/:productId` | Public | ✅ Masks encrypted fields |
| POST | `/` | SELLER/ADMIN | ✅ Create with encrypted credentials |
| PUT | `/:productId` | Owner seller | ✅ Update |
| DELETE | `/:productId` | Owner seller | ✅ Hard delete |

**Gaps:** No ProductStatus, no sold/delist lifecycle, no similar-vector endpoint.

### Cart (`/cart`)

| Method | Path | Status |
| ------ | ---- | ------ |
| GET | `/` | ✅ Auto-create cart |
| POST | `/:productId` | ✅ 1 qty, no duplicates |
| DELETE | `/` | ✅ Clear all items |
| DELETE | `/:productId` | ✅ |

### Orders (`/orders`)

| Method | Path | Role | Status |
| ------ | ---- | ---- | ------ |
| POST | `/` | BUYER | ✅ Creates PENDING, locks products |
| GET | `/` | BUYER | ✅ Buyer's orders |
| GET | `/all` | ADMIN | ✅ Paginated all orders |
| GET | `/:orderId` | Owner/ADMIN | ✅ |
| GET | `/:orderId/credentials` | BUYER | ✅ COMPLETED only |
| PATCH | `/:orderId/status` | ADMIN | ✅ No side effects (sold, email) |
| PATCH | `/:orderId/cancel` | BUYER | ✅ PENDING only, releases lock |

**Pending order expiry (Phase 2.5):**

- Env `ORDER_PENDING_TIMEOUT_MINUTES` (default **30**). Unpaid `PENDING` orders older than this are auto-cancelled and product `transactionBlock` is released.
- **Inline expiry:** runs on `GET /orders/:id`, `GET /orders` (buyer list), and `GET /orders/all` (admin) until cron-server batch job exists (Phase 8).
- **Manual cancel until cron:** buyers can `PATCH /orders/:id/cancel` while status is `PENDING`, or leave checkout via `/checkout/cancel?orderId=` (auto-cancel). Abandoned crypto checkouts keep the cart; reserved products unlock on cancel/expiry.

**Gaps:** No dispute link; email on completion deferred to Phase 3.

### Auth (`/auth`)

| Method | Path | Status |
| ------ | ---- | ------ |
| POST | `/register` | ✅ Creates verification token (email not sent) |
| POST | `/login` | ✅ Returns user (token in controller) |
| POST | `/google` | ✅ OAuth upsert |
| POST | `/refresh` | ✅ Rotate refresh token |
| GET | `/verify-email` | ✅ |
| POST | `/logout` | ✅ |
| POST | `/forgot-password` | ✅ Token logged, not emailed |
| POST | `/reset-password` | ✅ |

**Gaps:** Role escalation on register; no lastLoginAt update.

### Users (`/users`)

| Method | Path | Role | Status |
| ------ | ---- | ---- | ------ |
| GET | `/me` | Auth | ✅ |
| PUT | `/me` | Auth | ✅ |
| PUT | `/me/password` | Auth | ✅ |
| GET | `/` | ADMIN | ✅ Paginated, no search |
| PATCH | `/:userId/role` | ADMIN | ✅ |
| DELETE | `/:userId` | ADMIN | ✅ |

**Gaps:** No user detail with cart/orders/products; no seller delist.

### Enquiries (`/enquiries`)

| Method | Path | Status |
| ------ | ---- | ------ |
| POST | `/` | ✅ Guest or auth — `{ name, email, phone?, message }`; notifies help@ |
| GET | `/mine` | ✅ Auth |
| GET | `/` | ✅ Admin |
| PATCH | `/:id/close` | ✅ Admin |
| DELETE | `/:id` | ✅ Admin |

**Model:** `name`, `email`, `phone?`, `subject` (auto), `message`, optional `userId`.

### Disputes (`/disputes`)

| Method | Path | Status |
| ------ | ---- | ------ |
| POST | `/` | ✅ Buyer opens dispute on COMPLETED order |
| GET | `/mine` | ✅ Buyer/seller list |
| GET | `/` | ⏳ Admin list (501 placeholder, Phase 5) |

**Rules:** buyer must own order; one active dispute per order; `details.orderSnapshot` auto-attached.

### Payments — NOWPayments (`/payments/nowpayments`)

| Method | Path | Status |
| ------ | ---- | ------ |
| POST | `/create-invoice` | ✅ PENDING orders only |
| POST | `/ipn` | ✅ HMAC verify; `finished` → PROCESSING |

**Gaps:** No failure/expired handling; no bypass mode.

---

## Database models (current)

From `prisma/schema.prisma`:

| Model | Notes |
| ----- | ----- |
| `User` | Roles: ADMIN, SELLER, BUYER |
| `Product` | Encrypted credentials (Bytes), `isAvailable`, `transactionBlock` |
| `Cart` / `CartItem` | 1:1 user cart |
| `Order` / `OrderItem` | `OrderStatus`: PENDING, PROCESSING, COMPLETED, CANCELLED, REFUNDED |
| `Enquiry` | subject, message, name, email, phone?, isClosed, optional userId |
| Token models | VerificationToken, RefreshToken, PasswordResetToken |

**Missing models (planned Phase 1):** GameCategory, Dispute, SellerWallet, WalletLedger, embedding column.

---

## Key services

### Encryption (`services/encryption.service.ts`)

- AES encrypt/decrypt for `accountUsername`, `accountPassword`, `accountEmail`, `accountEmailPassword`
- Requires `ENCRYPTION_KEY` env

### Order creation (`orders/orders.services.ts`)

1. Validate products exist, available, not transaction-blocked
2. Sum prices + `ORDER_SERVICE_FEE_USD`
3. Create PENDING order with denormalized `priceAtPurchase`
4. Set `transactionBlock: true` on all products

### NOWPayments (`payments/nowpayments/`)

- Creates invoice for order total (USD)
- IPN callback updates to PROCESSING on `payment_status === "finished"`

---

## Environment variables

From `.env.example` + runtime requirements:

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `PORT` | Yes | Server port (default 8080) |
| `JWT_SECRET` | Yes | Access + refresh tokens |
| `SALT_ROUNDS` | Yes | bcrypt |
| `TOKEN_EXPIRATION` | Yes | JWT expiry |
| `ENCRYPTION_KEY` | Yes | Credential encryption |
| `FRONTEND_URL` | Yes | CORS + payment redirect URLs |
| `PUBLIC_API_BASE_URL` | Yes (payments) | NOWPayments IPN callback |
| `NOWPAYMENTS_API_KEY` | Payments | Sandbox/production |
| `NOWPAYMENTS_IPN_SECRET` | Payments | Webhook HMAC |
| `PAYMENT_BYPASS` | Dev/E2E | Skip NOWPayments (default `false`) |
| `ORDER_PENDING_TIMEOUT_MINUTES` | Orders | Auto-cancel unpaid PENDING orders (default **30**) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | Email | Shared SMTP server (same host for all mailboxes) |
| `EMAIL_*_ADDRESS` / `EMAIL_*_NAME` | Email | Sender profiles: `FINANCE`, `HELP`, `PURCHASE` |
| `EMAIL_*_USER` / `EMAIL_*_PASS` | Email | Per-sender SMTP login (each mailbox has its own credentials) |

**Planned additions:**
- Embedding provider keys

---

## Scripts

```bash
pnpm --filter=@smurfelite/express-server dev
pnpm --filter=@smurfelite/express-server prisma:generate
pnpm --filter=@smurfelite/express-server prisma:migrate
```

---

## Modules to add (planned)

| Module | Phase |
| ------ | ----- |
| `email/` | 3 |
| `payments/bypass/` | 2 |
| `orders/fulfillment.service.ts` | 2 |
| `game-category/` | 5 |
| `dispute/` | 4.2 buyer POST + mine; admin Phase 5 |
| `wallet/` | 5 |
| `products/embedding.service.ts` | 5 |

---

## Dependencies

- Consumes: PostgreSQL, `@smurfelite/types`
- Consumed by: nextjs-app, admin-app (planned), seller-app (planned), cron-server (planned)

---

## Related docs

- [feature-roadmap.md](./feature-roadmap.md) — Phases 1, 2, 3, 5, 9
- [issues.md](./issues.md) — Backend-related issues
- [shared-types.md](./shared-types.md) — Prisma generation
