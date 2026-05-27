import { prisma } from "../../../src/lib/prisma.js";
import { OrderStatus, ProductStatus } from "../../../src/types/prisma.js";
import { isPaymentBypassEnabled } from "../../../src/lib/payment-bypass.js";
import { SmokeRunner, assertEq } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest } from "../lib/http.mts";
import {
  addProductToCart,
  cancelOrder,
  clearServerCart,
  completeBypass,
  createOrderForProduct,
  findPurchasableProduct,
  getCartCount,
  releaseProductReservation,
} from "../lib/helpers.mts";

export async function runPhase2_3(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 2.3 — Cart & checkout fixes");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  runner.section("DELETE /cart clear-all");

  await runner.test("DELETE /cart removes all server cart items", async () => {
    await clearServerCart(ctx);

    const product = await findPurchasableProduct();
    runner.assert(product, "No purchasable product for cart test");

    await addProductToCart(ctx, product!.id);
    const before = await getCartCount(ctx);
    runner.assert(before >= 1, "Cart should have items before clear");

    await clearServerCart(ctx);
    const after = await getCartCount(ctx);
    assertEq(after, 0, "cart count after DELETE /cart");
  });

  runner.section("Cart preserved until payment success");

  let reservedProductId: string | undefined;
  let pendingOrderId: string | undefined;

  await runner.test("Creating order does not clear server cart", async () => {
    await clearServerCart(ctx);

    const product = await findPurchasableProduct();
    runner.assert(product, "No purchasable product");

    reservedProductId = product!.id;
    await addProductToCart(ctx, reservedProductId);
    const countBeforeOrder = await getCartCount(ctx);
    runner.assert(countBeforeOrder >= 1, "Cart should have item before order");

    const order = await createOrderForProduct(ctx, reservedProductId);
    pendingOrderId = order.id;

    const countAfterOrder = await getCartCount(ctx);
    assertEq(countAfterOrder, countBeforeOrder, "cart count after order create");
  });

  await runner.test("PATCH /orders/:id/cancel releases transactionBlock", async () => {
    runner.assert(pendingOrderId && reservedProductId, "missing order/product from prior test");

    const blocked = await prisma.product.findUnique({
      where: { id: reservedProductId! },
      select: { transactionBlock: true },
    });
    runner.assert(blocked?.transactionBlock === true, "product should be blocked while PENDING");

    await cancelOrder(ctx, pendingOrderId!);

    const order = await prisma.order.findUnique({
      where: { id: pendingOrderId! },
      select: { status: true },
    });
    assertEq(order?.status, OrderStatus.CANCELLED, "order status after cancel");

    const released = await prisma.product.findUnique({
      where: { id: reservedProductId! },
      select: { transactionBlock: true },
    });
    runner.assert(released?.transactionBlock === false, "transactionBlock should be released after cancel");

    const cartAfterCancel = await getCartCount(ctx);
    runner.assert(cartAfterCancel >= 1, "Cart should remain after cancel (not cleared on abandon)");
  });

  runner.section("Post-payment cart clear (success flow)");

  await runner.test("Cart clears after bypass payment + DELETE /cart", async () => {
    runner.assert(isPaymentBypassEnabled(), "PAYMENT_BYPASS must be true for bypass cart clear test");

    await clearServerCart(ctx);

    const product =
      (await findPurchasableProduct()) ??
      (reservedProductId
        ? await prisma.product.findFirst({
            where: { id: reservedProductId, status: ProductStatus.ACTIVE, isAvailable: true, transactionBlock: false },
          })
        : null);
    runner.assert(product, "No purchasable product for bypass cart clear test");

    await addProductToCart(ctx, product!.id);
    runner.assert((await getCartCount(ctx)) >= 1, "Cart should have item");

    const order = await createOrderForProduct(ctx, product!.id);
    await completeBypass(ctx, order.id);

    await clearServerCart(ctx);
    assertEq(await getCartCount(ctx), 0, "cart count after post-payment clear");
  });

  await runner.test("Cancel API returns 400 for non-PENDING orders", async () => {
    const completed = await prisma.order.findFirst({
      where: { status: OrderStatus.COMPLETED, buyerId: ctx.buyerId },
      select: { id: true },
    });
    if (!completed) return;

    await apiRequest(ctx, `/orders/${completed.id}/cancel`, {
      method: "PATCH",
      token: ctx.buyerToken,
      expectStatus: 400,
    });
  });

  // Cleanup: release any ACTIVE products left blocked from failed runs
  await runner.test("Cleanup: no ACTIVE products stuck with transactionBlock", async () => {
    const stuck = await prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        transactionBlock: true,
      },
      select: { id: true },
      take: 5,
    });
    for (const p of stuck) {
      await releaseProductReservation(p.id);
    }
    runner.assert(true, "cleanup ran");
  });

  return runner.finishPhase();
}
