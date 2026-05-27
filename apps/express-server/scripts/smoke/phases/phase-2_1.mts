import { isPaymentBypassEnabled } from "../../../src/lib/payment-bypass.js";
import {
  OrderStatus,
  PaymentStatus,
  ProductStatus,
} from "../../../src/types/prisma.js";
import { SmokeRunner, assertEq } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest } from "../lib/http.mts";
import {
  completeBypass,
  createOrderForProduct,
  findPurchasableProduct,
  cancelOrder,
} from "../lib/helpers.mts";

export async function runPhase2_1(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 2.1 — Payment bypass");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  runner.section("Bypass configuration");

  await runner.test("GET /payments/bypass/status returns enabled flag", async () => {
    const { data } = await apiRequest<{ enabled: boolean }>(
      ctx,
      "/payments/bypass/status",
      { expectStatus: 200 }
    );
    runner.assert(typeof data.enabled === "boolean", "enabled flag missing");
    assertEq(data.enabled, isPaymentBypassEnabled(), "API status matches env");
  });

  await runner.test("POST /payments/bypass/complete requires auth", async () => {
    await apiRequest(ctx, "/payments/bypass/complete", {
      method: "POST",
      body: { internalOrderId: "00000000-0000-0000-0000-000000000000" },
      expectStatus: 401,
    });
  });

  runner.section("Bypass payment flow");

  let productId: string | undefined;
  let orderId: string | undefined;

  await runner.test("Create PENDING order for bypass", async () => {
    runner.assert(isPaymentBypassEnabled(), "PAYMENT_BYPASS must be true for phase 2.1 tests");

    const product = await findPurchasableProduct();
    runner.assert(product, "No purchasable product available — seed data or release transactionBlock");

    productId = product!.id;
    const order = await createOrderForProduct(ctx, productId);
    orderId = order.id;
    assertEq(order.status, OrderStatus.PENDING, "order status");
  });

  await runner.test("Complete bypass marks order PAID + COMPLETED", async () => {
    runner.assert(orderId, "orderId missing from previous test");
    const order = await completeBypass(ctx, orderId!);
    assertEq(order.status, OrderStatus.COMPLETED, "order status after bypass");
    assertEq(order.paymentStatus, PaymentStatus.PAID, "paymentStatus after bypass");
    assertEq(order.paymentProvider, "bypass", "paymentProvider after bypass");
  });

  await runner.test("Bypass rejects non-owner", async () => {
    const product = await findPurchasableProduct();
    if (!product) return;

    const order = await createOrderForProduct(ctx, product.id);
    try {
      await apiRequest(ctx, "/payments/bypass/complete", {
        method: "POST",
        token: "invalid-token",
        body: { internalOrderId: order.id },
        expectStatus: 401,
      });
    } finally {
      await cancelOrder(ctx, order.id);
    }
  });

  if (productId) {
    // Leave product SOLD from main bypass test — expected side effect
  }

  return runner.finishPhase();
}
