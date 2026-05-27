import { prisma } from "../../../src/lib/prisma.js";
import {
  DisputeStatus,
  OrderStatus,
  WalletLedgerType,
} from "../../../src/types/prisma.js";
import { fulfillOrder } from "../../../src/modules/orders/fulfillment.service.js";
import { createOrder } from "../../../src/modules/orders/orders.services.js";
import { SmokeRunner } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest, loginAdmin } from "../lib/http.mts";
import { findPurchasableProduct, resetProductToActive } from "../lib/helpers.mts";

interface DisputeResponse {
  id: string;
  orderId: string;
  status: DisputeStatus;
  sellerId: string;
}

export async function runPhase5_5(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 5.5 — Disputes (full admin API)");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  const admin = await loginAdmin(ctx.apiBase);

  let productId: string | undefined;
  let sellerId: string | undefined;
  let orderId: string | undefined;
  let disputeId: string | undefined;
  let pendingAfterFulfill = 0;
  let frozenBefore = 0;

  runner.section("Dispute open + wallet freeze");

  await runner.test("Setup COMPLETED order and open dispute", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "No purchasable product for dispute wallet test");

    productId = product!.id;
    sellerId = product!.sellerId;

    const order = await createOrder(ctx.buyerId, [productId]);
    await fulfillOrder(order.id, "smoke-5.5");
    orderId = order.id;

    const walletAfterFulfill = await prisma.sellerWallet.findUnique({
      where: { userId: sellerId },
    });
    runner.assert(walletAfterFulfill, "wallet should exist after fulfillment");
    pendingAfterFulfill = Number(walletAfterFulfill!.pendingBalance);
    frozenBefore = Number(walletAfterFulfill!.frozenBalance);

    const { data } = await apiRequest<DisputeResponse>(ctx, "/disputes", {
      method: "POST",
      token: ctx.buyerToken,
      body: {
        orderId,
        reason: "Phase 5.5 smoke: credentials invalid after purchase.",
        details: { productId, category: "Credentials do not work" },
      },
      expectStatus: 201,
    });

    disputeId = data.id;
    runner.assert(data.status === DisputeStatus.OPEN, "dispute should be OPEN");
  });

  await runner.test("Opening dispute freezes seller wallet funds", async () => {
    runner.assert(sellerId && disputeId && orderId, "missing setup ids");

    const wallet = await prisma.sellerWallet.findUnique({
      where: { userId: sellerId! },
    });
    runner.assert(wallet, "seller wallet should exist");

    const freezeEntry = await prisma.walletLedger.findFirst({
      where: {
        disputeId: disputeId!,
        type: WalletLedgerType.DISPUTE_FREEZE,
      },
    });
    runner.assert(freezeEntry, "DISPUTE_FREEZE ledger entry expected");
    runner.assert(freezeEntry!.amount > 0, "freeze amount should be positive");

    runner.assert(
      Number(wallet!.frozenBalance) > frozenBefore,
      "frozenBalance should increase"
    );
    runner.assert(
      Number(wallet!.pendingBalance) < pendingAfterFulfill,
      "pendingBalance should decrease after freeze"
    );
  });

  runner.section("Admin disputes API");

  await runner.test("GET /disputes requires admin", async () => {
    await apiRequest(ctx, "/disputes", {
      token: ctx.buyerToken,
      expectStatus: 403,
    });
  });

  await runner.test("GET /disputes lists disputes with status filter", async () => {
    runner.assert(disputeId, "missing dispute id");

    const { data } = await apiRequest<{
      disputes: DisputeResponse[];
      meta: { totalCount: number };
    }>(ctx, "/disputes?status=OPEN", {
      token: admin.accessToken,
      expectStatus: 200,
    });

    runner.assert(Array.isArray(data.disputes), "disputes array expected");
    runner.assert(
      data.disputes.some((d) => d.id === disputeId),
      "created dispute should appear in admin list"
    );
  });

  await runner.test("PATCH /disputes/:id/status resolves in favor of seller", async () => {
    runner.assert(disputeId && sellerId, "missing ids");

    const walletBefore = await prisma.sellerWallet.findUnique({
      where: { userId: sellerId! },
    });
    const frozen = Number(walletBefore!.frozenBalance);

    const { data } = await apiRequest<DisputeResponse>(
      ctx,
      `/disputes/${disputeId}/status`,
      {
        method: "PATCH",
        token: admin.accessToken,
        body: { status: DisputeStatus.RESOLVED_SELLER },
        expectStatus: 200,
      }
    );
    runner.assert(
      data.status === DisputeStatus.RESOLVED_SELLER,
      "expected RESOLVED_SELLER"
    );

    const walletAfter = await prisma.sellerWallet.findUnique({
      where: { userId: sellerId! },
    });
    runner.assert(
      Number(walletAfter!.frozenBalance) < frozen,
      "frozenBalance should decrease after seller-favored resolution"
    );

    const releaseEntry = await prisma.walletLedger.findFirst({
      where: {
        disputeId: disputeId!,
        type: WalletLedgerType.DISPUTE_RELEASE,
      },
    });
    runner.assert(releaseEntry, "DISPUTE_RELEASE ledger entry expected");
  });

  runner.section("Cleanup");

  await runner.test("Reset product for future smoke runs", async () => {
    runner.assert(productId, "missing product id");
    await resetProductToActive(productId!);
    const order = await prisma.order.findUnique({
      where: { id: orderId! },
      select: { status: true },
    });
    runner.assert(order?.status === OrderStatus.COMPLETED, "order stays completed");
  });

  return runner.finishPhase();
}
