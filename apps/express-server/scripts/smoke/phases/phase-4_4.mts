import { prisma } from "../../../src/lib/prisma.js";
import { ProductStatus } from "../../../src/types/prisma.js";
import { isPaymentBypassEnabled } from "../../../src/lib/payment-bypass.js";
import { SmokeRunner, assertEq, assertIncludes } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest } from "../lib/http.mts";
import {
  createOrderForProduct,
  findPurchasableProduct,
  releaseProductReservation,
  resetProductToActive,
} from "../lib/helpers.mts";

export async function runPhase4_4(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 4.4 — Checkout UX (API)");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  let testProductId: string | undefined;

  runner.section("Payment bypass status (test mode UI)");

  await runner.test("GET /payments/bypass/status exposes test mode flag", async () => {
    const { data } = await apiRequest<{ enabled: boolean }>(
      ctx,
      "/payments/bypass/status",
      { expectStatus: 200 }
    );
    runner.assert(typeof data.enabled === "boolean", "enabled flag missing");
    assertEq(data.enabled, isPaymentBypassEnabled(), "matches PAYMENT_BYPASS env");
  });

  runner.section("Unavailable product guards");

  await runner.test("POST /orders rejects SOLD product", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "No purchasable product");
    testProductId = product!.id;

    await prisma.product.update({
      where: { id: testProductId },
      data: { status: ProductStatus.SOLD, isAvailable: false },
    });

    const { status, data } = await apiRequest<{ message?: string }>(ctx, "/orders", {
      method: "POST",
      token: ctx.buyerToken,
      body: { productIds: [testProductId] },
    });

    runner.assert(status === 400, `expected 400, got ${status}`);
    const message = data.message ?? "";
    assertIncludes(
      message.toLowerCase(),
      "no longer available",
      "error message"
    );

    await resetProductToActive(testProductId);
  });

  await runner.test("POST /orders rejects transaction-blocked product", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "No purchasable product");
    testProductId = product!.id;

    await prisma.product.update({
      where: { id: testProductId },
      data: { transactionBlock: true },
    });

    const { status, data } = await apiRequest<{ message?: string }>(ctx, "/orders", {
      method: "POST",
      token: ctx.buyerToken,
      body: { productIds: [testProductId] },
    });

    runner.assert(status === 400, `expected 400, got ${status}`);
    const message = data.message ?? "";
    assertIncludes(
      message.toLowerCase(),
      "no longer available",
      "error message"
    );

    await releaseProductReservation(testProductId);
  });

  runner.section("Valid checkout path");

  await runner.test("POST /orders succeeds for purchasable product", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "No purchasable product");
    testProductId = product!.id;

    const order = await createOrderForProduct(ctx, testProductId);
    runner.assert(order.id.length > 0, "order id missing");
    assertEq(order.status, "PENDING", "order status");

    await releaseProductReservation(testProductId);
    try {
      await apiRequest(ctx, `/orders/${order.id}/cancel`, {
        method: "PATCH",
        token: ctx.buyerToken,
        expectStatus: 200,
      });
    } catch {
      // cleanup best-effort
    }
  });

  await runner.test("GET /products/:id reflects purchasable state for checkout", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "No purchasable product");

    const { data } = await apiRequest<{
      status: string;
      isAvailable: boolean;
      sellerDelisted: boolean;
    }>(ctx, `/products/${product!.id}`, { expectStatus: 200 });

    assertEq(data.status, "ACTIVE", "status");
    runner.assert(data.isAvailable === true, "isAvailable");
    runner.assert(data.sellerDelisted === false, "sellerDelisted");
  });

  return runner.finishPhase();
}
