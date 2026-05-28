Repo level scripts:

1. build: pnpm build
2. run: pnpm start:dev

Database:

1. App-> pgadmin
2. generate types -> pnpm prisma generate (on express repo)

## Payments (NOWPayments, sandbox)

1. Copy [`apps/express-server/.env.example`](apps/express-server/.env.example) to `apps/express-server/.env` and set `NOWPAYMENTS_API_KEY` and `NOWPAYMENTS_IPN_SECRET` from the NOWPayments **sandbox** dashboard.
2. Set `PUBLIC_API_BASE_URL` to the **public HTTPS origin** of the Express API (no trailing slash), e.g. `https://abc123.ngrok.io`. NOWPayments cannot send IPN webhooks to `localhost`; use ngrok or Cloudflare Tunnel while developing.
3. IPN endpoint: `POST /api/payments/nowpayments/ipn` (signature header `x-nowpayments-sig`, verified with `NOWPAYMENTS_IPN_SECRET`).
4. Buyer flow: `POST /api/orders` then `POST /api/payments/nowpayments/create-invoice` with `{ "internalOrderId": "<uuid>" }`; redirect the browser to `invoiceUrl`.
5. Production: switch `NOWPAYMENTS_API_BASE_URL` to `https://api.nowpayments.io/v1` and use production API keys.

Manual checks: valid signature + `payment_status` `finished` fulfills order to `COMPLETED`; `failed`/`expired` cancels and unlocks products; `refunded` on completed order sets `REFUNDED`; invalid signature returns `401`; duplicate IPN is idempotent; PENDING orders on `/orders` can retry via Pay with crypto; cancel URL returns the user to `/checkout/cancel`.

## Payments (PayPal, sandbox)

1. Set `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE=sandbox`, and `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (same client id) in express-server and nextjs-app env.
2. Register webhook URL `POST /api/payments/paypal/webhook` in PayPal Developer Dashboard; set `PAYPAL_WEBHOOK_ID`.
3. Checkout: select PayPal → create order → approve in PayPal buttons → order `COMPLETED`.
4. PENDING orders: **Pay with PayPal** on `/orders` reuses create-order + modal buttons.

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
