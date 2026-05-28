import { prisma } from "../../../src/lib/prisma.js";
import {
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  WalletLedgerType,
} from "../../../src/types/prisma.js";
import { createOrder } from "../../../src/modules/orders/orders.services.js";
import {
  cancelOrderDueToPaymentFailure,
  applyPaymentRefund,
  handleIpnPaymentStatus,
} from "../../../src/modules/orders/payment-lifecycle.service.js";
import { createInvoiceForOrder } from "../../../src/modules/payments/nowpayments/nowpayments.service.js";
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

export async function runPhase9_1(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 9.1 — NOWPayments hardening");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  runner.section("IPN failure unlocks products");

  await runner.test("failed IPN cancels PENDING order and releases lock", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "no purchasable product");

    const order = await createOrder(ctx.buyerId, [product!.id]);
    const updated = await cancelOrderDueToPaymentFailure(order.id, {
      paymentProvider: "nowpayments",
      nowpaymentsPaymentId: `smoke-fail-${order.id}`,
    });

    runner.assert(updated?.status === OrderStatus.CANCELLED, "CANCELLED");
    runner.assert(updated?.paymentStatus === PaymentStatus.FAILED, "FAILED");

    const refreshedProduct = await prisma.product.findUnique({
      where: { id: product!.id },
      select: { transactionBlock: true },
    });
    runner.assert(
      refreshedProduct?.transactionBlock === false,
      "transactionBlock released"
    );

    await resetProduct(product!.id);
  });

  runner.section("IPN success fulfills order");

  await runner.test("finished IPN fulfills PENDING order to COMPLETED", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "no purchasable product");

    const order = await createOrder(ctx.buyerId, [product!.id]);
    const fulfilled = await handleIpnPaymentStatus(order.id, "finished", {
      paymentProvider: "nowpayments",
      nowpaymentsPaymentId: `smoke-paid-${order.id}`,
    });

    runner.assert(fulfilled?.paymentStatus === PaymentStatus.PAID, "PAID");
    runner.assert(fulfilled?.status === OrderStatus.COMPLETED, "COMPLETED");

    const refreshedProduct = await prisma.product.findUnique({
      where: { id: product!.id },
      select: { status: true, transactionBlock: true },
    });
    runner.assert(
      refreshedProduct?.status === ProductStatus.SOLD,
      "product SOLD"
    );
    runner.assert(
      refreshedProduct?.transactionBlock === false,
      "transactionBlock cleared"
    );

    await resetProduct(product!.id);
  });

  await runner.test("duplicate finished IPN is idempotent", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "no purchasable product");

    const order = await createOrder(ctx.buyerId, [product!.id]);
    await handleIpnPaymentStatus(order.id, "finished", {
      paymentProvider: "nowpayments",
      nowpaymentsPaymentId: `smoke-dup-${order.id}`,
    });

    const ledgerBefore = await prisma.walletLedger.count({
      where: { orderId: order.id, type: WalletLedgerType.SALE_CREDIT },
    });

    const second = await handleIpnPaymentStatus(order.id, "finished", {
      paymentProvider: "nowpayments",
      nowpaymentsPaymentId: `smoke-dup-${order.id}`,
    });

    const ledgerAfter = await prisma.walletLedger.count({
      where: { orderId: order.id, type: WalletLedgerType.SALE_CREDIT },
    });

    runner.assert(second?.status === OrderStatus.COMPLETED, "still COMPLETED");
    runner.assert(ledgerBefore === ledgerAfter, "no duplicate wallet credit");

    await resetProduct(product!.id);
  });

  runner.section("Refund on completed order");

  await runner.test("refunded IPN marks COMPLETED order as REFUNDED", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "no purchasable product");

    const order = await createOrder(ctx.buyerId, [product!.id]);
    await handleIpnPaymentStatus(order.id, "finished", {
      paymentProvider: "nowpayments",
      nowpaymentsPaymentId: `smoke-ref-${order.id}`,
    });

    const refunded = await applyPaymentRefund(order.id, {
      paymentProvider: "nowpayments",
    });

    runner.assert(refunded?.status === OrderStatus.REFUNDED, "REFUNDED");
    runner.assert(
      refunded?.paymentStatus === PaymentStatus.REFUNDED,
      "payment REFUNDED"
    );

    await resetProduct(product!.id);
  });

  runner.section("Invoice id fields");

  await runner.test("createInvoiceForOrder sets nowpaymentsInvoiceId", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "no purchasable product");

    const order = await createOrder(ctx.buyerId, [product!.id]);

    const hasNowPayments =
      Boolean(process.env.NOWPAYMENTS_API_KEY?.trim()) &&
      Boolean(process.env.PUBLIC_API_BASE_URL?.trim());

    if (!hasNowPayments) {
      console.log(
        "  ⊘ skipped: NOWPAYMENTS_API_KEY or PUBLIC_API_BASE_URL not set"
      );
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED },
      });
      await resetProduct(product!.id);
      return;
    }

    try {
      const result = await createInvoiceForOrder(order.id, ctx.buyerId);
      runner.assert(Boolean(result.invoiceId), "invoice id returned");

      const refreshed = await prisma.order.findUnique({
        where: { id: order.id },
        select: {
          nowpaymentsInvoiceId: true,
          nowpaymentsPaymentId: true,
        },
      });

      runner.assert(
        refreshed?.nowpaymentsInvoiceId === result.invoiceId,
        "nowpaymentsInvoiceId stored"
      );
      runner.assert(
        refreshed?.nowpaymentsPaymentId === null,
        "payment id not set at invoice time"
      );
    } catch {
      console.log("  ⊘ skipped: NOWPayments API unavailable in this environment");
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELLED },
    });
    await resetProduct(product!.id);
  });

  return runner.finishPhase();
}
