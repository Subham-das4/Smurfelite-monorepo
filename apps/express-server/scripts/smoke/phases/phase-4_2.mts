import { prisma } from "../../../src/lib/prisma.js";
import { DisputeStatus, OrderStatus } from "../../../src/types/prisma.js";
import { createDispute } from "../../../src/modules/dispute/dispute.service.js";
import { fulfillOrder } from "../../../src/modules/orders/fulfillment.service.js";
import { createOrder } from "../../../src/modules/orders/orders.services.js";
import { SmokeRunner, assertEq } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest } from "../lib/http.mts";
import { findPurchasableProduct } from "../lib/helpers.mts";

interface DisputeResponse {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  status: DisputeStatus;
  reason: string;
  details: Record<string, unknown> | null;
}

export async function runPhase4_2(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 4.2 — Buyer disputes");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  let completedOrderId: string | undefined;
  let sellerId: string | undefined;
  let productId: string | undefined;
  let disputeId: string | undefined;

  runner.section("Setup completed order");

  await runner.test("Create COMPLETED order for dispute flow", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "No purchasable product for dispute test");

    productId = product!.id;
    sellerId = product!.sellerId;

    const order = await createOrder(ctx.buyerId, [productId]);
    await fulfillOrder(order.id, "smoke-4.2");
    completedOrderId = order.id;

    const refreshed = await prisma.order.findUnique({
      where: { id: completedOrderId },
      select: { status: true },
    });
    assertEq(refreshed?.status, OrderStatus.COMPLETED, "order status");
  });

  runner.section("POST /disputes");

  await runner.test("Buyer can open dispute on COMPLETED order", async () => {
    runner.assert(completedOrderId && sellerId, "missing setup ids");

    const payload = {
      orderId: completedOrderId,
      reason: "Credentials do not work: smoke test dispute for phase 4.2.",
      details: {
        category: "Credentials do not work",
        description: "Smoke test dispute details for phase 4.2.",
        productId,
      },
    };

    const { status, data } = await apiRequest<DisputeResponse>(ctx, "/disputes", {
      method: "POST",
      token: ctx.buyerToken,
      body: payload,
      expectStatus: 201,
    });

    runner.assert(status === 201, "expected 201");
    assertEq(data.orderId, completedOrderId!, "orderId");
    assertEq(data.buyerId, ctx.buyerId, "buyerId");
    assertEq(data.sellerId, sellerId!, "sellerId");
    assertEq(data.status, DisputeStatus.OPEN, "status");
    runner.assert(
      typeof data.details?.orderSnapshot === "object",
      "expected orderSnapshot in details"
    );
    disputeId = data.id;
  });

  await runner.test("Duplicate active dispute is rejected", async () => {
    runner.assert(completedOrderId, "missing completed order id");

    await apiRequest(ctx, "/disputes", {
      method: "POST",
      token: ctx.buyerToken,
      body: {
        orderId: completedOrderId,
        reason: "Second dispute attempt should fail for same order.",
      },
      expectStatus: 400,
    });
  });

  await runner.test("PENDING order cannot be disputed", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "No purchasable product for pending dispute test");

    const pendingOrder = await createOrder(ctx.buyerId, [product!.id]);

    await apiRequest(ctx, "/disputes", {
      method: "POST",
      token: ctx.buyerToken,
      body: {
        orderId: pendingOrder.id,
        reason: "Attempting dispute on pending order should fail.",
      },
      expectStatus: 400,
    });
  });

  await runner.test("Non-owner cannot open dispute", async () => {
    runner.assert(completedOrderId, "missing completed order id");

    await apiRequest(ctx, "/disputes", {
      method: "POST",
      body: {
        orderId: completedOrderId,
        reason: "Guest should not be able to open disputes.",
      },
      expectStatus: 401,
    });
  });

  runner.section("GET /disputes/mine");

  await runner.test("Buyer sees their dispute in /disputes/mine", async () => {
    runner.assert(disputeId, "missing dispute id");

    const { data } = await apiRequest<DisputeResponse[]>(ctx, "/disputes/mine", {
      token: ctx.buyerToken,
      expectStatus: 200,
    });

    runner.assert(Array.isArray(data), "expected array response");
    runner.assert(
      data.some((entry) => entry.id === disputeId),
      "created dispute should appear in mine list"
    );
  });

  await runner.test("Admin disputes list remains Phase 5 placeholder", async () => {
    await apiRequest(ctx, "/disputes", {
      token: ctx.buyerToken,
      expectStatus: 403,
    });
  });

  return runner.finishPhase();
}
