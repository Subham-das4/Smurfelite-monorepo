import { prisma } from "../../../src/lib/prisma.js";
import { ProductStatus } from "../../../src/types/prisma.js";
import { fulfillOrder } from "../../../src/modules/orders/fulfillment.service.js";
import { PUBLIC_LISTABLE_PRODUCT_WHERE } from "../../../src/modules/product/product.constants.js";
import type { SmokeContext } from "./runner.mts";
import { apiRequest } from "./http.mts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidProductUuid(id: string): boolean {
  return UUID_RE.test(id);
}

/** Dev smoke prep: release locks and re-open sold UUID products for repeatable runs. */
export async function prepareSmokeEnvironment(): Promise<void> {
  await prisma.product.updateMany({
    where: { status: ProductStatus.ACTIVE, transactionBlock: true },
    data: { transactionBlock: false },
  });

  const sold = await prisma.product.findMany({
    where: { status: ProductStatus.SOLD },
    select: { id: true },
    take: 20,
  });

  const reopenIds = sold.filter((p) => isValidProductUuid(p.id)).map((p) => p.id);
  if (reopenIds.length === 0) return;

  await prisma.product.updateMany({
    where: { id: { in: reopenIds } },
    data: {
      status: ProductStatus.ACTIVE,
      isAvailable: true,
      transactionBlock: false,
    },
  });
}

export async function countPurchasableProducts(): Promise<number> {
  const products = await prisma.product.findMany({
    where: {
      ...PUBLIC_LISTABLE_PRODUCT_WHERE,
      transactionBlock: false,
    },
    select: { id: true },
  });
  return products.filter((p) => isValidProductUuid(p.id)).length;
}

export async function findPurchasableProduct(excludeIds: string[] = []) {
  const products = await prisma.product.findMany({
    where: {
      ...PUBLIC_LISTABLE_PRODUCT_WHERE,
      transactionBlock: false,
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return products.find((p) => isValidProductUuid(p.id)) ?? null;
}

export async function getCartCount(ctx: SmokeContext): Promise<number> {
  const { data } = await apiRequest<{ count?: number }>(ctx, "/cart", {
    token: ctx.buyerToken,
    expectStatus: 200,
  });
  return data.count ?? 0;
}

export async function addProductToCart(
  ctx: SmokeContext,
  productId: string
): Promise<void> {
  await apiRequest(ctx, `/cart/${productId}`, {
    method: "POST",
    token: ctx.buyerToken,
    expectStatus: 200,
  });
}

export async function clearServerCart(ctx: SmokeContext): Promise<void> {
  await apiRequest(ctx, "/cart", {
    method: "DELETE",
    token: ctx.buyerToken,
    expectStatus: 200,
  });
}

export async function createOrderForProduct(
  ctx: SmokeContext,
  productId: string
): Promise<{ id: string; status: string }> {
  if (!isValidProductUuid(productId)) {
    throw new Error(`productId is not a valid UUID: ${productId}`);
  }

  const { data } = await apiRequest<{ id: string; status: string }>(ctx, "/orders", {
    method: "POST",
    token: ctx.buyerToken,
    body: { productIds: [productId] },
    expectStatus: 201,
  });
  return data;
}

export async function cancelOrder(ctx: SmokeContext, orderId: string): Promise<void> {
  await apiRequest(ctx, `/orders/${orderId}/cancel`, {
    method: "PATCH",
    token: ctx.buyerToken,
    expectStatus: 200,
  });
}

export async function fulfillOrderForSmoke(
  orderId: string
): Promise<{ status: string; paymentStatus: string; paymentProvider?: string }> {
  const order = await fulfillOrder(orderId, "smoke");
  if (!order) {
    throw new Error(`fulfillOrder failed for order ${orderId}`);
  }
  return {
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentProvider: order.paymentProvider ?? undefined,
  };
}

/** Best-effort cleanup so repeated smoke runs can reuse products. */
export async function releaseProductReservation(productId: string): Promise<void> {
  await prisma.product.updateMany({
    where: { id: productId, status: ProductStatus.ACTIVE },
    data: { transactionBlock: false, isAvailable: true },
  });
}

export async function resetProductToActive(productId: string): Promise<void> {
  await prisma.product.update({
    where: { id: productId },
    data: {
      status: ProductStatus.ACTIVE,
      isAvailable: true,
      transactionBlock: false,
    },
  });
}
