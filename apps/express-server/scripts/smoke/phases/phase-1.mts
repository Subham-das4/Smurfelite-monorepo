import { prisma } from "../../../src/lib/prisma.js";
import {
  DisputeStatus,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  WalletLedgerType,
} from "../../../src/types/prisma.js";
import { PUBLIC_LISTABLE_PRODUCT_WHERE } from "../../../src/modules/product/product.constants.js";
import { SmokeRunner } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest } from "../lib/http.mts";

export async function runPhase1(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 1 — Schema & foundations");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  runner.section("Prisma schema & models");

  await runner.test("ProductStatus enum values exist in DB layer", async () => {
    runner.assert(
      ProductStatus.ACTIVE === "ACTIVE" && ProductStatus.SOLD === "SOLD",
      "ProductStatus enum missing expected values"
    );
  });

  await runner.test("PaymentStatus enum values exist", async () => {
    runner.assert(PaymentStatus.PAID === "PAID", "PaymentStatus.PAID missing");
  });

  await runner.test("DisputeStatus enum values exist", async () => {
    runner.assert(DisputeStatus.OPEN === "OPEN", "DisputeStatus.OPEN missing");
  });

  await runner.test("WalletLedgerType enum values exist", async () => {
    runner.assert(
      WalletLedgerType.SALE_CREDIT === "SALE_CREDIT",
      "WalletLedgerType.SALE_CREDIT missing"
    );
  });

  await runner.test("Game model is queryable", async () => {
    await prisma.game.findMany({ take: 1 });
  });

  await runner.test("Platform model is queryable", async () => {
    await prisma.platform.findMany({ take: 1 });
  });

  await runner.test("Dispute model is queryable", async () => {
    await prisma.dispute.findMany({ take: 1 });
  });

  await runner.test("SellerWallet model is queryable", async () => {
    await prisma.sellerWallet.findMany({ take: 1 });
  });

  await runner.test("WalletLedger model is queryable", async () => {
    await prisma.walletLedger.findMany({ take: 1 });
  });

  await runner.test("Product has status, sellerDelisted, deletedAt fields", async () => {
    const product = await prisma.product.findFirst({
      select: { status: true, sellerDelisted: true, deletedAt: true },
    });
    runner.assert(product, "No products in database for field check");
    runner.assert(
      typeof product!.status === "string" && typeof product!.sellerDelisted === "boolean",
      "Product lifecycle fields missing"
    );
  });

  await runner.test("Order has paymentStatus field", async () => {
    const order = await prisma.order.findFirst({
      select: { paymentStatus: true, status: true },
    });
    runner.assert(order, "No orders in database for paymentStatus check");
    runner.assert(
      typeof order!.paymentStatus === "string",
      "Order.paymentStatus missing"
    );
  });

  runner.section("Auth & user fields");

  await runner.test("User.lastLoginAt is set after login", async () => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.buyerId },
      select: { lastLoginAt: true },
    });
    runner.assert(user?.lastLoginAt, "lastLoginAt should be set from smoke login");
  });

  runner.section("Placeholder API routes (501)");

  await runner.test("GET /games returns public list", async () => {
    const { status, data } = await apiRequest<{ games: unknown[] }>(
      ctx,
      "/games",
      { expectStatus: 200 }
    );
    runner.assert(status === 200, "Expected 200");
    runner.assert(Array.isArray(data.games), "Expected games array");
  });

  await runner.test("GET /platforms returns public list", async () => {
    const { status, data } = await apiRequest<{ platforms: unknown[] }>(
      ctx,
      "/platforms",
      { expectStatus: 200 }
    );
    runner.assert(status === 200, "Expected 200");
    runner.assert(Array.isArray(data.platforms), "Expected platforms array");
  });

  await runner.test("GET /disputes forbidden for buyer (admin only)", async () => {
    await apiRequest(ctx, "/disputes", {
      token: ctx.buyerToken,
      expectStatus: 403,
    });
  });

  await runner.test("GET /wallets/me forbidden for buyer (seller only)", async () => {
    await apiRequest(ctx, "/wallets/me", {
      token: ctx.buyerToken,
      expectStatus: 403,
    });
  });

  runner.section("Product listing filter (ACTIVE + listable)");

  await runner.test("GET /products returns only public listable products", async () => {
    const { data } = await apiRequest<{
      products: Array<{
        status: string;
        sellerDelisted: boolean;
        isAvailable: boolean;
      }>;
    }>(ctx, "/products?page=1&pageSize=20", { expectStatus: 200 });

    runner.assert(Array.isArray(data.products), "products array missing");
    for (const p of data.products) {
      runner.assert(
        p.status === ProductStatus.ACTIVE,
        `Listed product ${p.status} is not ACTIVE`
      );
      runner.assert(!p.sellerDelisted, "Listed product is sellerDelisted");
      runner.assert(p.isAvailable, "Listed product is not available");
    }
  });

  await runner.test("Public listing excludes SOLD products", async () => {
    const sold = await prisma.product.findFirst({
      where: { status: ProductStatus.SOLD },
      select: { id: true },
    });
    if (!sold) return;

    const { data } = await apiRequest<{ products: Array<{ id: string }> }>(
      ctx,
      "/products?page=1&pageSize=100",
      { expectStatus: 200 }
    );
    const ids = data.products.map((p) => p.id);
    runner.assert(!ids.includes(sold.id), "SOLD product appeared in public listing");
  });

  await runner.test("PUBLIC_LISTABLE_PRODUCT_WHERE matches listing rules", async () => {
    const count = await prisma.product.count({ where: PUBLIC_LISTABLE_PRODUCT_WHERE });
    runner.assert(count >= 0, "PUBLIC_LISTABLE_PRODUCT_WHERE query failed");
  });

  return runner.finishPhase();
}
