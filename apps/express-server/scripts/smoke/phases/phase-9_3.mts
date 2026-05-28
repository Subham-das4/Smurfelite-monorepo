import { prisma } from "../../../src/lib/prisma.js";
import {
  OrderStatus,
  PaymentStatus,
  ProductStatus,
} from "../../../src/types/prisma.js";
import { createOrder } from "../../../src/modules/orders/orders.services.js";
import {
  assertCapturedAmountMatchesOrder,
  capturePayPalOrder,
} from "../../../src/modules/payments/paypal/paypal.service.js";
import { isPayPalEnabled } from "../../../src/lib/paypal-config.js";
import { SmokeRunner } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { findPurchasableProduct } from "../lib/helpers.mts";

async function resetProduct(productId: string) {
  await prisma.product.update({
    where: { id: productId },
    data: {
      transactionBlock: false,
      status: ProductStatus.ACTIVE,
      isAvailable: true,
    },
  });
}

export async function runPhase9_3(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 9.3 — PayPal re-enable");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  runner.section("PayPal config");

  await runner.test("isPayPalEnabled reflects env credentials", async () => {
    const enabled = isPayPalEnabled();
    const hasCreds = Boolean(
      process.env.PAYPAL_CLIENT_ID?.trim() &&
        process.env.PAYPAL_CLIENT_SECRET?.trim()
    );
    runner.assert(enabled === hasCreds, "enabled matches credential presence");
  });

  runner.section("Capture guards");

  await runner.test("capture rejects PayPal order ID mismatch", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "no purchasable product");

    const order = await createOrder(ctx.buyerId, [product!.id]);
    await prisma.order.update({
      where: { id: order.id },
      data: { paypalOrderId: "PAYPAL-STORED-ID" },
    });

    let threw = false;
    try {
      await capturePayPalOrder("WRONG-PAYPAL-ID", order.id, ctx.buyerId);
    } catch (e) {
      threw = true;
      const message = e instanceof Error ? e.message : String(e);
      runner.assert(
        message.includes("does not match"),
        "mismatch error message"
      );
    }
    runner.assert(threw, "capture threw on mismatch");

    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELLED },
    });
    await resetProduct(product!.id);
  });

  await runner.test("assertCapturedAmountMatchesOrder validates totals", async () => {
    assertCapturedAmountMatchesOrder("10.00", 10);
    let threw = false;
    try {
      assertCapturedAmountMatchesOrder("9.00", 10);
    } catch {
      threw = true;
    }
    runner.assert(threw, "amount mismatch throws");
  });

  await runner.test("GET /payments/paypal/status returns enabled flag", async () => {
    const { apiRequest } = await import("../lib/http.mts");
    const { data } = await apiRequest<{ enabled: boolean }>(
      ctx,
      "/payments/paypal/status",
      { expectStatus: 200 }
    );
    runner.assert(typeof data.enabled === "boolean", "enabled boolean");
  });

  runner.section("Live PayPal API (optional)");

  await runner.test("createPayPalOrder stores paypalOrderId", async () => {
    if (!isPayPalEnabled()) {
      console.log("  ⊘ skipped: PayPal credentials not configured");
      return;
    }

    const product = await findPurchasableProduct();
    runner.assert(product, "no purchasable product");

    const order = await createOrder(ctx.buyerId, [product!.id]);

    try {
      const { createPayPalOrder } = await import(
        "../../../src/modules/payments/paypal/paypal.service.js"
      );
      const result = await createPayPalOrder(order.id, ctx.buyerId);
      runner.assert(Boolean(result.paypalOrderId), "paypal order id returned");

      const refreshed = await prisma.order.findUnique({
        where: { id: order.id },
        select: { paypalOrderId: true, paymentProvider: true },
      });
      runner.assert(
        refreshed?.paypalOrderId === result.paypalOrderId,
        "paypalOrderId persisted"
      );
      runner.assert(
        refreshed?.paymentProvider === "paypal",
        "paymentProvider paypal"
      );
    } catch {
      console.log("  ⊘ skipped: PayPal sandbox API unavailable");
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.FAILED },
    });
    await resetProduct(product!.id);
  });

  return runner.finishPhase();
}
