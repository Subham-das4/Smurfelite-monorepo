import { prisma } from "../../../src/lib/prisma.js";
import { OrderStatus } from "../../../src/types/prisma.js";
import {
  getOrderPendingTimeoutMinutes,
  getPendingOrderExpiryCutoff,
} from "../../../src/lib/order-pending-timeout.js";
import {
  expireAllStalePendingOrders,
  isPendingOrderExpired,
} from "../../../src/modules/orders/order-expiry.service.js";
import { SmokeRunner, assertEq } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest } from "../lib/http.mts";
import {
  cancelOrder,
  createOrderForProduct,
  findPurchasableProduct,
} from "../lib/helpers.mts";

export async function runPhase2_5(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 2.5 — Order expiry");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  runner.section("Timeout configuration");

  await runner.test("ORDER_PENDING_TIMEOUT_MINUTES defaults to 30", async () => {
    const minutes = getOrderPendingTimeoutMinutes();
    runner.assert(minutes >= 1, "timeout must be at least 1 minute");
    assertEq(minutes, 30, "default timeout minutes");
  });

  await runner.test("isPendingOrderExpired respects cutoff", async () => {
    const cutoff = getPendingOrderExpiryCutoff();
    const stale = new Date(cutoff.getTime() - 60_000);
    const fresh = new Date(cutoff.getTime() + 60_000);

    runner.assert(
      isPendingOrderExpired({ status: OrderStatus.PENDING, createdAt: stale }),
      "order before cutoff should be expired"
    );
    runner.assert(
      !isPendingOrderExpired({ status: OrderStatus.PENDING, createdAt: fresh }),
      "order after cutoff should not be expired"
    );
    runner.assert(
      !isPendingOrderExpired({
        status: OrderStatus.COMPLETED,
        createdAt: stale,
      }),
      "non-PENDING orders are never expired"
    );
  });

  runner.section("Inline expiry on order fetch");

  let orderId: string | undefined;
  let productId: string | undefined;

  await runner.test("Stale PENDING order auto-cancelled on GET /orders/:id", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "No purchasable product for expiry test");

    productId = product!.id;
    const order = await createOrderForProduct(ctx, productId);
    orderId = order.id;

    const timeoutMs = getOrderPendingTimeoutMinutes() * 60 * 1000;
    await prisma.order.update({
      where: { id: orderId },
      data: { createdAt: new Date(Date.now() - timeoutMs - 60_000) },
    });

    const blocked = await prisma.product.findUnique({
      where: { id: productId },
      select: { transactionBlock: true },
    });
    runner.assert(blocked?.transactionBlock === true, "product should be blocked before expiry");

    const { data } = await apiRequest<{ status: string }>(
      ctx,
      `/orders/${orderId}`,
      { token: ctx.buyerToken, expectStatus: 200 }
    );
    assertEq(data.status, OrderStatus.CANCELLED, "order status after inline expiry");

    const released = await prisma.product.findUnique({
      where: { id: productId },
      select: { transactionBlock: true },
    });
    runner.assert(
      released?.transactionBlock === false,
      "transactionBlock should be released after expiry"
    );
  });

  await runner.test("Fresh PENDING order is not expired on fetch", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "No purchasable product for fresh order test");

    const order = await createOrderForProduct(ctx, product!.id);

    const { data } = await apiRequest<{ status: string }>(
      ctx,
      `/orders/${order.id}`,
      { token: ctx.buyerToken, expectStatus: 200 }
    );
    assertEq(data.status, OrderStatus.PENDING, "fresh order should stay PENDING");

    await cancelOrder(ctx, order.id);
  });

  await runner.test("expireAllStalePendingOrders batch cancels stale orders", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "No purchasable product for batch expiry test");

    const order = await createOrderForProduct(ctx, product!.id);
    const timeoutMs = getOrderPendingTimeoutMinutes() * 60 * 1000;

    await prisma.order.update({
      where: { id: order.id },
      data: { createdAt: new Date(Date.now() - timeoutMs - 120_000) },
    });

    const count = await expireAllStalePendingOrders();
    runner.assert(count >= 1, "batch expiry should cancel at least one order");

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      select: { status: true },
    });
    assertEq(updated?.status, OrderStatus.CANCELLED, "batch-expired order status");
  });

  return runner.finishPhase();
}
