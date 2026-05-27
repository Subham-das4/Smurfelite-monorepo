import { prisma } from "../../../src/lib/prisma.js";
import { SmokeRunner } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest, loginAdmin, loginSeller } from "../lib/http.mts";
import { fulfillOrder } from "../../../src/modules/orders/fulfillment.service.js";
import { createOrder } from "../../../src/modules/orders/orders.services.js";
import { findPurchasableProduct } from "../lib/helpers.mts";
import { getSmokeGameAndPlatformIds } from "../lib/product-fixtures.mts";

export async function runPhase5_10(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 5.10 — Portal API");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  const admin = await loginAdmin(ctx.apiBase);
  const seller = await loginSeller(ctx.apiBase);
  const buyerToken = ctx.buyerToken;
  const buyerId = ctx.buyerId;

  runner.section("Seller product list");

  await runner.test("GET /products/mine returns seller listings", async () => {
    const { data } = await apiRequest<{
      products: { id: string; sellerId: string }[];
      meta: { totalCount: number };
    }>(ctx, "/products/mine?page=1&pageSize=5", {
      token: seller.accessToken,
      expectStatus: 200,
    });
    runner.assert(Array.isArray(data.products), "products array");
    if (data.products.length > 0) {
      runner.assert(
        data.products.every((p) => p.sellerId === seller.userId),
        "all products belong to seller"
      );
    }
  });

  await runner.test("GET /products/mine forbidden for buyer", async () => {
    await apiRequest(ctx, "/products/mine", {
      token: buyerToken,
      expectStatus: 403,
    });
  });

  runner.section("Admin product list");

  await runner.test("GET /products/admin returns products with seller email", async () => {
    const { data } = await apiRequest<{
      products: { id: string; status: string; sellerEmail?: string }[];
    }>(ctx, "/products/admin?page=1&pageSize=5", {
      token: admin.accessToken,
      expectStatus: 200,
    });
    runner.assert(Array.isArray(data.products), "products array");
    if (data.products.length > 0) {
      runner.assert(
        typeof data.products[0].sellerEmail === "string",
        "sellerEmail present"
      );
    }
  });

  await runner.test("GET /products/admin/:id returns non-ACTIVE product", async () => {
    const { gameId, platformId } = await getSmokeGameAndPlatformIds(ctx);
    const { data: created } = await apiRequest<{ id: string; status: string }>(
      ctx,
      "/products",
      {
        method: "POST",
        token: seller.accessToken,
        body: {
          gameId,
          platformId,
          title: `smoke-5.10-admin-detail-${Date.now()}`,
          price: 5,
          specifications: {},
          accountUsername: "u",
          accountPassword: "p",
          accountEmail: "e",
          accountEmailPassword: "ep",
        },
        expectStatus: 201,
      }
    );
    runner.assert(created.status === "DRAFT", "expected DRAFT product");
    const { data } = await apiRequest<{ id: string; status: string }>(
      ctx,
      `/products/admin/${created.id}`,
      { token: admin.accessToken, expectStatus: 200 }
    );
    runner.assert(data.id === created.id, "admin detail id mismatch");
    runner.assert(data.status === "DRAFT", "admin detail should include DRAFT status");
    await apiRequest(ctx, `/products/${created.id}`, { expectStatus: 404 });
    await prisma.product.delete({ where: { id: created.id } });
  });

  runner.section("Seller sales");

  await runner.test("GET /orders/seller returns sales lines", async () => {
    const { data } = await apiRequest<{
      sales: unknown[];
      meta: { totalCount: number };
    }>(ctx, "/orders/seller?page=1&pageSize=10", {
      token: seller.accessToken,
      expectStatus: 200,
    });
    runner.assert(Array.isArray(data.sales), "sales array");
  });

  runner.section("Wallet ledger & admin wallets");

  await runner.test("GET /wallets/me/ledger returns entries", async () => {
    const { data } = await apiRequest<{
      entries: unknown[];
      meta: { totalCount: number };
    }>(ctx, "/wallets/me/ledger?page=1&pageSize=10", {
      token: seller.accessToken,
      expectStatus: 200,
    });
    runner.assert(Array.isArray(data.entries), "ledger entries");
  });

  await runner.test("GET /wallets lists seller wallets (admin)", async () => {
    const { data } = await apiRequest<{
      wallets: { sellerId: string; sellerEmail: string }[];
    }>(ctx, "/wallets?page=1&pageSize=10", {
      token: admin.accessToken,
      expectStatus: 200,
    });
    runner.assert(Array.isArray(data.wallets), "wallets array");
    const found = data.wallets.some((w) => w.sellerId === seller.userId);
    runner.assert(found, "smoke seller wallet in list");
  });

  await runner.test("GET /wallets/:sellerId returns wallet detail", async () => {
    const { data } = await apiRequest<{
      sellerId: string;
      pendingBalance: number;
    }>(ctx, `/wallets/${seller.userId}`, {
      token: admin.accessToken,
      expectStatus: 200,
    });
    runner.assert(data.sellerId === seller.userId, "sellerId match");
  });

  await runner.test("GET /wallets/:sellerId/ledger returns ledger", async () => {
    const { data } = await apiRequest<{ entries: unknown[] }>(
      ctx,
      `/wallets/${seller.userId}/ledger?page=1&pageSize=5`,
      {
        token: admin.accessToken,
        expectStatus: 200,
      }
    );
    runner.assert(Array.isArray(data.entries), "ledger entries");
  });

  runner.section("Admin order credentials");

  await runner.test("GET /orders/:id/credentials allowed for admin on COMPLETED order", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "need purchasable product");

    const order = await createOrder(buyerId, [product!.id]);
    await fulfillOrder(order.id);

    const { data } = await apiRequest<{
      orderId: string;
      credentials: { accountUsername: string }[];
    }>(ctx, `/orders/${order.id}/credentials`, {
      token: admin.accessToken,
      expectStatus: 200,
    });
    runner.assert(data.orderId === order.id, "orderId match");
    runner.assert(data.credentials.length > 0, "credentials returned");
    runner.assert(
      data.credentials[0].accountUsername.length > 0,
      "username decrypted"
    );
  });

  return runner.finishPhase();
}
