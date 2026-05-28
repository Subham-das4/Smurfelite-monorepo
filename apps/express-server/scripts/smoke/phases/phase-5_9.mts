import { prisma } from "../../../src/lib/prisma.js";
import {
  OrderStatus,
  PaymentStatus,
  ProductStatus,
} from "../../../src/types/prisma.js";
import { mapIpnPaymentStatus } from "../../../src/lib/payment-status.js";
import { applyIpnPaymentStatus } from "../../../src/modules/orders/payment-status.service.js";
import { fulfillOrder } from "../../../src/modules/orders/fulfillment.service.js";
import { createOrder } from "../../../src/modules/orders/orders.services.js";
import { completeBypassPayment } from "../../../src/modules/payments/bypass/bypass.service.js";
import { SmokeRunner } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest } from "../lib/http.mts";
import { findPurchasableProduct } from "../lib/helpers.mts";

export async function runPhase5_9(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 5.9 — Payment status");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  runner.section("PaymentStatus mapping");

  await runner.test("mapIpnPaymentStatus maps finished → PAID", async () => {
    runner.assert(
      mapIpnPaymentStatus("finished") === PaymentStatus.PAID,
      "finished → PAID"
    );
    runner.assert(
      mapIpnPaymentStatus("failed") === PaymentStatus.FAILED,
      "failed → FAILED"
    );
    runner.assert(
      mapIpnPaymentStatus("refunded") === PaymentStatus.REFUNDED,
      "refunded → REFUNDED"
    );
  });

  runner.section("Order lifecycle paymentStatus");

  await runner.test("New order defaults to paymentStatus PENDING", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "no purchasable product");

    const order = await createOrder(ctx.buyerId, [product!.id]);
    runner.assert(order.paymentStatus === PaymentStatus.PENDING, "PENDING on create");

    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELLED },
    });
    await prisma.product.update({
      where: { id: product!.id },
      data: { transactionBlock: false },
    });
  });

  await runner.test("Bypass completion sets paymentStatus PAID", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "no purchasable product");

    const order = await createOrder(ctx.buyerId, [product!.id]);
    await completeBypassPayment(order.id, ctx.buyerId);

    const refreshed = await prisma.order.findUnique({
      where: { id: order.id },
      select: { paymentStatus: true, status: true },
    });
    runner.assert(refreshed?.paymentStatus === PaymentStatus.PAID, "PAID after bypass");
    runner.assert(refreshed?.status === OrderStatus.COMPLETED, "COMPLETED after bypass");
  });

  await runner.test("IPN handler updates paymentStatus on pending order", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "no purchasable product");

    const order = await createOrder(ctx.buyerId, [product!.id]);
    const updated = await applyIpnPaymentStatus(order.id, "finished", {
      paymentProvider: "nowpayments",
      paymentIntent: `smoke-ipn-${order.id}`,
    });

    runner.assert(updated?.paymentStatus === PaymentStatus.PAID, "PAID from IPN");
    runner.assert(updated?.status === OrderStatus.COMPLETED, "COMPLETED after IPN fulfill");

    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELLED },
    });
    await prisma.product.update({
      where: { id: product!.id },
      data: {
        transactionBlock: false,
        status: ProductStatus.ACTIVE,
        isAvailable: true,
      },
    });
  });

  await runner.test("GET /orders/:id exposes paymentStatus field", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "no purchasable product");

    const order = await createOrder(ctx.buyerId, [product!.id]);
    const { data } = await apiRequest<{ paymentStatus: string }>(
      ctx,
      `/orders/${order.id}`,
      { token: ctx.buyerToken, expectStatus: 200 }
    );
    runner.assert(data.paymentStatus === "PENDING", "API exposes paymentStatus");

    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELLED },
    });
    await prisma.product.update({
      where: { id: product!.id },
      data: { transactionBlock: false },
    });
  });

  return runner.finishPhase();
}
