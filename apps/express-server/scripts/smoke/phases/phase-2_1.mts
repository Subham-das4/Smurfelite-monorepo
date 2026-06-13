import {
  OrderStatus,
  PaymentStatus,
} from "../../../src/types/prisma.js";
import { SmokeRunner, assertEq } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest } from "../lib/http.mts";
import {
  createOrderForProduct,
  findPurchasableProduct,
  fulfillOrderForSmoke,
} from "../lib/helpers.mts";

export async function runPhase2_1(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 2.1 — Order fulfillment (smoke)");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  runner.section("Direct fulfillment");

  let orderId: string | undefined;

  await runner.test("Create PENDING order for fulfillment", async () => {
    const product = await findPurchasableProduct();
    runner.assert(
      product,
      "No purchasable product available — seed data or release transactionBlock"
    );

    const order = await createOrderForProduct(ctx, product!.id);
    orderId = order.id;
    assertEq(order.status, OrderStatus.PENDING, "order status");
  });

  await runner.test("fulfillOrder marks order PAID + COMPLETED", async () => {
    runner.assert(orderId, "orderId missing from previous test");
    const order = await fulfillOrderForSmoke(orderId!);
    assertEq(order.status, OrderStatus.COMPLETED, "order status after fulfill");
    assertEq(order.paymentStatus, PaymentStatus.PAID, "paymentStatus after fulfill");
    assertEq(order.paymentProvider, "smoke", "paymentProvider after fulfill");
  });

  return runner.finishPhase();
}
