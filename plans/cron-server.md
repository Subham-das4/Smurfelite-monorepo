# cron-server (planned)

Background job runner for scheduled maintenance and balance operations. **Not created yet.**

**Planned path:** `apps/cron-server`  
**Roadmap phase:** 8  
**Architecture:** Separate Node process (not embedded in express-server)

---

## Purpose

Per prompt.md requirement #13:

- Move seller balance from **pending** to **available to withdraw** after hold period
- Complement express-server with time-based tasks that should not block HTTP requests

Additional jobs identified during audit:

- Expire stale PENDING orders and release product `transactionBlock`
- Backfill product embeddings for pgvector similar search (optional)

---

## Why a separate app?

| Reason | Detail |
| ------ | ------ |
| Single responsibility | API server scales horizontally; cron should run once |
| Deployment | Cron can run on a single worker / VM without exposing HTTP |
| Failure isolation | Long-running batch jobs don't affect API latency |
| Restart safety | Jobs can be idempotent with advisory locks |

---

## Planned folder structure

```
apps/cron-server/
├── src/
│   ├── index.ts              # Scheduler entry
│   ├── config.ts             # Env parsing
│   ├── db.ts                 # Prisma client import
│   ├── jobs/
│   │   ├── wallet-hold-release.ts
│   │   ├── order-expiry.ts
│   │   └── embedding-backfill.ts
│   └── utils/
│       └── lock.ts           # Postgres advisory lock
├── package.json
└── .env.example
```

---

## Jobs specification

### Job 1: Wallet hold release

**Trigger:** Every hour (configurable)  
**Phase dependency:** Phase 1 schema + Phase 5 wallet logic

**Logic:**
1. Query `WalletLedger` entries where type = `SALE_CREDIT` and `createdAt < now - HOLD_DAYS`
2. For each uncredited release, move amount from `SellerWallet.pendingBalance` to `availableBalance`
3. Insert ledger entry type = `HOLD_RELEASED`
4. Idempotent: skip if release ledger entry already exists for orderId

**Env:**
- `WALLET_HOLD_DAYS` (default: 7)
- `WALLET_RELEASE_CRON` (cron expression, default `0 * * * *`)

---

### Job 2: Order expiry

**Trigger:** Every 5–15 minutes  
**Phase dependency:** Phase 2 (timeout constant defined)

**Note:** express-server already runs **inline expiry** on order fetch (Phase 2.5). This cron job will catch orders that are never fetched again (e.g. buyer never returns to the site).

**Logic:**
1. Find orders where `status = PENDING` and `createdAt < now - ORDER_PENDING_TIMEOUT_MINUTES`
2. For each: set `CANCELLED`, release `transactionBlock` on related products
3. Log count of expired orders

**Env:**
- `ORDER_PENDING_TIMEOUT_MINUTES` (default: 30)
- `ORDER_EXPIRY_CRON` (default `*/10 * * * *`)

**Fixes:** ISS-007 (partial — IPN failure still needs Phase 9)

---

### Job 3: Embedding backfill (optional)

**Trigger:** Daily or on-demand  
**Phase dependency:** Phase 5 pgvector setup

**Logic:**
1. Find products where `embedding IS NULL` and `status = ACTIVE`
2. Build text from title + description + specifications
3. Call embedding provider API
4. Store vector on Product row

**Env:**
- `EMBEDDING_PROVIDER_API_KEY`
- `EMBEDDING_BATCH_SIZE` (default: 10)
- `EMBEDDING_BACKFILL_CRON` (default `0 3 * * *`)

---

## Database access

- Use same `DATABASE_URL` as express-server
- Import Prisma client from `@smurfelite/types` generated output
- No schema duplication — single migration source in express-server

```typescript
// Pattern
import { PrismaClient } from '@smurfelite/types';
```

---

## Concurrency / locking

Prevent duplicate runs when multiple instances accidentally start:

```sql
SELECT pg_try_advisory_lock(123456789);
-- run job
SELECT pg_advisory_unlock(123456789);
```

Or use a `CronJobRun` audit table with unique `(jobName, runWindow)`.

---

## Package setup (planned)

```json
{
  "name": "@smurfelite/cron-server",
  "type": "module",
  "scripts": {
    "dev": "tsx watch --env-file=.env src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc"
  },
  "dependencies": {
    "@smurfelite/types": "workspace:*",
    "@prisma/client": "^7.1.0",
    "node-cron": "^3.x"
  }
}
```

Add to root turbo.json pipeline.

---

## Environment variables (.env.example)

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `DATABASE_URL` | — | PostgreSQL (required) |
| `WALLET_HOLD_DAYS` | 7 | Days before pending → available |
| `WALLET_RELEASE_CRON` | `0 * * * *` | Hold release schedule |
| `ORDER_PENDING_TIMEOUT_MINUTES` | 30 | Order expiry threshold |
| `ORDER_EXPIRY_CRON` | `*/10 * * * *` | Order expiry schedule |
| `EMBEDDING_BACKFILL_CRON` | `0 3 * * *` | Optional embedding job |
| `LOG_LEVEL` | info | Winston log level |

---

## Observability

- Structured logs via winston (match express-server)
- Each job run: start/end, records processed, errors
- Optional: POST failures to `/logs` API or external monitoring

---

## Deployment notes

- Run as single replica (Kubernetes `replicas: 1` or dedicated cron VM)
- Health: process alive check; no HTTP health endpoint required initially
- Graceful shutdown: finish current job iteration before exit

---

## Implementation checklist (Phase 8)

- [ ] Scaffold `apps/cron-server` package
- [ ] Wire Prisma + DATABASE_URL
- [ ] Implement advisory lock utility
- [ ] Job: order expiry (highest priority — unblocks inventory)
- [ ] Job: wallet hold release (after Phase 5 wallet writes exist)
- [ ] Job: embedding backfill (optional)
- [ ] Document in root readMe.md
- [ ] Add to `pnpm start:dev` optionally or separate `pnpm dev:cron`

---

## Related docs

- [express-server.md](./express-server.md) — order + wallet business logic
- [feature-roadmap.md](./feature-roadmap.md) — Phase 8 tasks
- [issues.md](./issues.md) — ISS-007
