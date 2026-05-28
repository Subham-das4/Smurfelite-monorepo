import { SmokeRunner } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import {
  apiRequest,
  loginBuyerPortal,
  loginSellerPortal,
  loginAdminPortal,
} from "../lib/http.mts";

const BUYER_EMAIL = () =>
  process.env.SMOKE_BUYER_EMAIL?.trim() || "buyer@buyer.com";
const BUYER_PASSWORD = () =>
  process.env.SMOKE_BUYER_PASSWORD?.trim() || "buyer123";
const SELLER_EMAIL = () =>
  process.env.SMOKE_SELLER_EMAIL?.trim() || "seller@seller.com";
const SELLER_PASSWORD = () =>
  process.env.SMOKE_SELLER_PASSWORD?.trim() || "seller123";
const ADMIN_EMAIL = () =>
  process.env.SMOKE_ADMIN_EMAIL?.trim() || "admin@admin.com";
const ADMIN_PASSWORD = () =>
  process.env.SMOKE_ADMIN_PASSWORD?.trim() || "admin123";

export async function runPhase10_9(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 10.9 — Route guards & cross-portal hardening");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  runner.section("Seller portal token blocked on buyer routes");

  const sellerPortal = await loginSellerPortal(
    ctx.apiBase,
    SELLER_EMAIL(),
    SELLER_PASSWORD()
  );

  await runner.test("Seller portal → GET /cart", async () => {
    await apiRequest(ctx, "/cart", {
      token: sellerPortal.accessToken,
      expectStatus: 403,
    });
  });

  await runner.test("Seller portal → POST /orders", async () => {
    await apiRequest(ctx, "/orders", {
      method: "POST",
      token: sellerPortal.accessToken,
      body: { productIds: [] },
      expectStatus: 403,
    });
  });

  await runner.test("Seller portal → GET /orders", async () => {
    await apiRequest(ctx, "/orders", {
      token: sellerPortal.accessToken,
      expectStatus: 403,
    });
  });

  await runner.test("Seller portal → GET /orders/:orderId", async () => {
    const buyerAsBuyer = await loginBuyerPortal(
      ctx.apiBase,
      SELLER_EMAIL(),
      SELLER_PASSWORD()
    );
    const { data: orders } = await apiRequest<{ id?: string }[]>(ctx, "/orders", {
      token: buyerAsBuyer.accessToken,
      expectStatus: 200,
    });
    const orderId = Array.isArray(orders) && orders[0]?.id;
    if (!orderId) {
      console.log("    (skipped: no seller buyer orders for GET /orders/:id guard)");
      return;
    }
    await apiRequest(ctx, `/orders/${orderId}`, {
      token: sellerPortal.accessToken,
      expectStatus: 403,
    });
  });

  await runner.test("Seller portal → POST /disputes", async () => {
    await apiRequest(ctx, "/disputes", {
      method: "POST",
      token: sellerPortal.accessToken,
      body: {
        orderId: "00000000-0000-0000-0000-000000000001",
        reason: "Smoke cross-portal guard test",
      },
      expectStatus: 403,
    });
  });

  runner.section("Buyer portal token blocked on seller routes");

  const buyerPortal = await loginBuyerPortal(
    ctx.apiBase,
    BUYER_EMAIL(),
    BUYER_PASSWORD()
  );

  await runner.test("Buyer portal → GET /products/mine", async () => {
    await apiRequest(ctx, "/products/mine", {
      token: buyerPortal.accessToken,
      expectStatus: 403,
    });
  });

  await runner.test("Buyer portal → GET /orders/seller", async () => {
    await apiRequest(ctx, "/orders/seller", {
      token: buyerPortal.accessToken,
      expectStatus: 403,
    });
  });

  await runner.test("Buyer portal → GET /wallets/me", async () => {
    await apiRequest(ctx, "/wallets/me", {
      token: buyerPortal.accessToken,
      expectStatus: 403,
    });
  });

  runner.section("Admin token blocked on buyer cart");

  const adminPortal = await loginAdminPortal(
    ctx.apiBase,
    ADMIN_EMAIL(),
    ADMIN_PASSWORD()
  );

  await runner.test("Admin portal → GET /cart", async () => {
    await apiRequest(ctx, "/cart", {
      token: adminPortal.accessToken,
      expectStatus: 403,
    });
  });

  runner.section("Happy path — correct portal context allowed");

  await runner.test("Buyer portal → GET /cart", async () => {
    await apiRequest(ctx, "/cart", {
      token: buyerPortal.accessToken,
      expectStatus: 200,
    });
  });

  await runner.test("Seller as buyer → GET /cart", async () => {
    const sellerAsBuyer = await loginBuyerPortal(
      ctx.apiBase,
      SELLER_EMAIL(),
      SELLER_PASSWORD()
    );
    await apiRequest(ctx, "/cart", {
      token: sellerAsBuyer.accessToken,
      expectStatus: 200,
    });
  });

  await runner.test("Seller as buyer → GET /orders/:orderId when order exists", async () => {
    const sellerAsBuyer = await loginBuyerPortal(
      ctx.apiBase,
      SELLER_EMAIL(),
      SELLER_PASSWORD()
    );
    const { data: orders } = await apiRequest<{ id?: string }[]>(ctx, "/orders", {
      token: sellerAsBuyer.accessToken,
      expectStatus: 200,
    });
    const orderId = Array.isArray(orders) && orders[0]?.id;
    if (!orderId) {
      console.log("    (skipped: no seller buyer orders for GET /orders/:id happy path)");
      return;
    }
    await apiRequest(ctx, `/orders/${orderId}`, {
      token: sellerAsBuyer.accessToken,
      expectStatus: 200,
    });
  });

  await runner.test("Seller portal → GET /products/mine", async () => {
    await apiRequest(ctx, "/products/mine", {
      token: sellerPortal.accessToken,
      expectStatus: 200,
    });
  });

  return runner.finishPhase();
}
