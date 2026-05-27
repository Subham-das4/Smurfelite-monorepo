import { prisma } from "../../../src/lib/prisma.js";
import { ProductStatus } from "../../../src/types/prisma.js";
import { PUBLIC_LISTABLE_PRODUCT_WHERE } from "../../../src/modules/product/product.constants.js";
import type { SmokeContext } from "./runner.mts";
import { apiRequest } from "./http.mts";

export async function findPurchasableProduct(excludeIds: string[] = []) {
  return prisma.product.findFirst({
    where: {
      ...PUBLIC_LISTABLE_PRODUCT_WHERE,
      transactionBlock: false,
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
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

export async function completeBypass(
  ctx: SmokeContext,
  orderId: string
): Promise<{ status: string; paymentStatus: string; paymentProvider?: string }> {
  const { data } = await apiRequest<{
    order: { status: string; paymentStatus: string; paymentProvider?: string };
  }>(ctx, "/payments/bypass/complete", {
    method: "POST",
    token: ctx.buyerToken,
    body: { internalOrderId: orderId },
    expectStatus: 200,
  });
  return data.order;
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
