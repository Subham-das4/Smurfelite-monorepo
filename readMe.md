Repo level scripts:

1. build: pnpm build
2. run: pnpm start:dev

## Docker (full stack)

Compose project name: **`smurfelite`**. Subdomains: `www`, `api`, `admin`, `seller` on `.smurfelite.store`.

### Local machine (ports 80 free)

1. Hosts file — `127.0.0.1 www.smurfelite.store api.smurfelite.store admin.smurfelite.store seller.smurfelite.store`
2. `cp docker/.env.example docker/.env` — set `ENCRYPTION_KEY` (32 chars), `JWT_SECRET`, passwords; use `http://` URLs for local if needed
3. `cp docker-compose.override.example.yml docker-compose.override.yml` — binds nginx to host `:80`
4. `pnpm docker:build && pnpm docker:up`

### Shared VPS (another stack already on :80 / :443)

SmurfElite nginx binds **`127.0.0.1:8001`** only. Route domains from your **existing edge nginx** using [`docker/nginx/host-edge-snippet.conf`](docker/nginx/host-edge-snippet.conf).

Full guide: [`docker/DEPLOY-SHARED-VPS.md`](docker/DEPLOY-SHARED-VPS.md).

```bash
cp docker/.env.example docker/.env   # https:// URLs for production
pnpm docker:build
pnpm docker:up
# Add host-edge-snippet.conf to other project's nginx conf.d, then reload that nginx
```

Migrations run on `express-server` startup (`prisma migrate deploy`).

Payment webhooks (production):

- NOWPayments IPN: `https://api.smurfelite.store/api/payments/nowpayments/ipn`
- PayPal: `https://api.smurfelite.store/api/payments/paypal/webhook`

Verify after deploy: `GET /api/payments/paypal/status` and `GET /api/payments/nowpayments/status` return `{ "enabled": true }` when credentials are configured.

### Per-app Dockerfiles

| App | Dockerfile |
|-----|------------|
| express-server | `apps/express-server/Dockerfile` |
| cron-server | `apps/cron-server/Dockerfile` |
| nextjs-app | `apps/nextjs-app/Dockerfile` |
| admin-app | `apps/admin-app/Dockerfile` |
| seller-app | `apps/seller-app/Dockerfile` |

Build context is always the **monorepo root**.

Database:

1. App-> pgadmin
2. generate types -> pnpm prisma generate (on express repo)

## Payments (NOWPayments, sandbox)

1. Copy [`apps/express-server/.env.example`](apps/express-server/.env.example) to `apps/express-server/.env` and set `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`, and `PUBLIC_API_BASE_URL`.
2. Set `PUBLIC_API_BASE_URL` to the **public HTTPS origin** of the Express API (no trailing slash), e.g. `https://abc123.ngrok.io` locally or `https://api.smurfelite.store` in production. NOWPayments cannot send IPN webhooks to `localhost`; use ngrok or Cloudflare Tunnel while developing.
3. Register IPN URL in NOWPayments dashboard: `https://api.smurfelite.store/api/payments/nowpayments/ipn` (signature header `x-nowpayments-sig`, verified with `NOWPAYMENTS_IPN_SECRET`).
4. Checkout and `/orders` show **Pay with crypto** when `GET /api/payments/nowpayments/status` returns `{ "enabled": true }` (requires API key, IPN secret, and `PUBLIC_API_BASE_URL`).
5. Buyer flow: `POST /api/orders` then `POST /api/payments/nowpayments/create-invoice` with `{ "internalOrderId": "<uuid>" }`; redirect the browser to `invoiceUrl`.
6. Production: set `NOWPAYMENTS_API_BASE_URL` to `https://api.nowpayments.io/v1` and use production API keys.

Manual checks: valid signature + `payment_status` `finished` fulfills order to `COMPLETED`; `failed`/`expired` cancels and unlocks products; `refunded` on completed order sets `REFUNDED`; invalid signature returns `401`; duplicate IPN is idempotent; PENDING orders on `/orders` can retry via Pay with crypto; cancel URL returns the user to `/checkout/cancel`.

## Payments (PayPal, sandbox)

1. Set `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE=sandbox`, and `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (same client id) in express-server and nextjs-app env. Rebuild nextjs-app after changing `NEXT_PUBLIC_PAYPAL_CLIENT_ID`.
2. Register webhook URL `https://api.smurfelite.store/api/payments/paypal/webhook` in PayPal Developer Dashboard; set `PAYPAL_WEBHOOK_ID`.
3. Checkout shows PayPal when `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is set and `GET /api/payments/paypal/status` returns `{ "enabled": true }`.
4. Checkout: select PayPal → create order → approve in PayPal buttons → order `COMPLETED`.
5. PENDING orders: **Pay with PayPal** on `/orders` reuses create-order + modal buttons.

<!-- ****************************************** -->
<!-- ****************************************** -->
<!-- ********** Postman script **************** -->
<!-- ****************************************** -->
<!-- ****************************************** -->

// Postman Test Script for Login (POST /api/auth/login)

// Ensure the request was successful (HTTP 200 OK)
pm.test("Status code is 200 OK", function () {
pm.response.to.have.status(200);
});

// Check if the response contains the 'token' field
pm.test("Response body has the 'token' field", function () {
const responseData = pm.response.json();
pm.expect(responseData).to.be.an('object');
pm.expect(responseData).to.have.property('token');
});

// --- Main Action: Store the Access Token ---

// Get the response data (JSON)
const responseData = pm.response.json();

// 1. Extract the token from the response
const accessToken = responseData.token;

// 2. Check if the token was successfully extracted
if (accessToken) {
// 3. Store the token in the Postman Environment
// The key 'accessToken' will be used in the Authorization header of other requests.
pm.environment.set("accessToken", accessToken);

    pm.test("Access Token saved to environment variable 'accessToken'", function () {
        // This test passes if the code block runs successfully
        pm.expect(pm.environment.get("accessToken")).to.eql(accessToken);
    });

    // Optional: Also save the User ID for testing ownership checks later
    const userId = responseData.user.id;
    if (userId) {
        pm.environment.set("currentUserId", userId);
        pm.test("User ID saved to environment variable 'currentUserId'", function () {
            pm.expect(pm.environment.get("currentUserId")).to.eql(userId);
        });
    }

} else {
// If the token is missing, fail the test and log a warning
pm.test("Token extraction failed", function() {
pm.expect(accessToken).to.be.a('string', 'Token was null or undefined in the response.');
});
}
