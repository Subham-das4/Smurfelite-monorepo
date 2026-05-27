import { prisma } from "../../../src/lib/prisma.js";
import {
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  WalletLedgerType,
} from "../../../src/types/prisma.js";
import { fulfillOrder } from "../../../src/modules/orders/fulfillment.service.js";
import { createOrder } from "../../../src/modules/orders/orders.services.js";
import { SmokeRunner, assertEq } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { findPurchasableProduct } from "../lib/helpers.mts";

export async function runPhase2_2(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 2.2 — Order fulfillment");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  runner.section("Fulfillment service");

  let productId: string | undefined;
  let sellerId: string | undefined;
  let orderId: string | undefined;
  let ledgerCountBefore = 0;
  let pendingBalanceBefore = 0;

  await runner.test("createOrder sets transactionBlock on products", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "No purchasable product for fulfillment test");

    productId = product!.id;
    sellerId = product!.sellerId;

    const order = await createOrder(ctx.buyerId, [productId]);
    orderId = order.id;
    assertEq(order.status, OrderStatus.PENDING, "order status");

    const blocked = await prisma.product.findUnique({
      where: { id: productId },
      select: { transactionBlock: true },
    });
    runner.assert(blocked?.transactionBlock === true, "transactionBlock should be true after order create");
  });

  await runner.test("fulfillOrder completes order and marks products SOLD", async () => {
    runner.assert(orderId, "orderId missing");

    const walletBefore = await prisma.sellerWallet.findUnique({
      where: { userId: sellerId! },
    });
    pendingBalanceBefore = walletBefore ? Number(walletBefore.pendingBalance) : 0;

    ledgerCountBefore = await prisma.walletLedger.count({
      where: { walletUserId: sellerId!, orderId: orderId! },
    });

    const fulfilled = await fulfillOrder(orderId!, "smoke-test");
    assertEq(fulfilled?.status, OrderStatus.COMPLETED, "fulfilled order status");
    assertEq(fulfilled?.paymentStatus, PaymentStatus.PAID, "fulfilled paymentStatus");

    const product = await prisma.product.findUnique({
      where: { id: productId! },
      select: {
        status: true,
        isAvailable: true,
        transactionBlock: true,
        price: true,
      },
    });
    assertEq(product?.status, ProductStatus.SOLD, "product status");
    runner.assert(product?.isAvailable === false, "product should be unavailable");
    runner.assert(product?.transactionBlock === false, "transactionBlock should be released");
  });

  await runner.test("fulfillOrder credits seller wallet pendingBalance", async () => {
    runner.assert(sellerId && orderId && productId, "missing ids from prior tests");

    const product = await prisma.product.findUnique({
      where: { id: productId! },
      select: { price: true },
    });
    const wallet = await prisma.sellerWallet.findUnique({
      where: { userId: sellerId! },
    });
    runner.assert(wallet, "SellerWallet should exist after fulfillment");

    const expectedMin = pendingBalanceBefore + Number(product!.price);
    runner.assert(
      Number(wallet!.pendingBalance) >= expectedMin,
      `pendingBalance should increase by at least product price (${expectedMin})`
    );
  });

  await runner.test("fulfillOrder writes WalletLedger SALE_CREDIT entry", async () => {
    runner.assert(sellerId && orderId, "missing ids");

    const entries = await prisma.walletLedger.findMany({
      where: { walletUserId: sellerId!, orderId: orderId! },
    });
    runner.assert(entries.length > ledgerCountBefore, "Expected new ledger entry");

    const credit = entries.find((e) => e.type === WalletLedgerType.SALE_CREDIT);
    runner.assert(credit, "SALE_CREDIT ledger entry missing");
    runner.assert(Number(credit!.amount) > 0, "ledger amount should be positive");
  });

  await runner.test("fulfillOrder is idempotent for COMPLETED orders", async () => {
    runner.assert(orderId, "orderId missing");
    const first = await fulfillOrder(orderId!, "smoke-test");
    const second = await fulfillOrder(orderId!, "smoke-test");
    assertEq(first?.id, second?.id, "idempotent fulfill should return same order");
    assertEq(second?.status, OrderStatus.COMPLETED, "still COMPLETED");
  });

  return runner.finishPhase();
}
