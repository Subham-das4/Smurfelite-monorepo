import { OrderStatus, Prisma } from "../../types/prisma.js";
import { prisma } from "../../lib/prisma.js";
import {
  getPendingOrderExpiryCutoff,
  getOrderPendingTimeoutMinutes,
} from "../../lib/order-pending-timeout.js";
import logger from "../../utils/logger.js";

type PendingOrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

export function isPendingOrderExpired(order: {
  status: OrderStatus;
  createdAt: Date;
}): boolean {
  if (order.status !== OrderStatus.PENDING) return false;
  return order.createdAt < getPendingOrderExpiryCutoff();
}

async function cancelPendingOrderInTx(
  tx: Prisma.TransactionClient,
  order: PendingOrderWithItems
) {
  const productIds = order.items.map((i) => i.productId);

  await tx.product.updateMany({
    where: { id: { in: productIds } },
    data: { transactionBlock: false },
  });

  return tx.order.update({
    where: { id: order.id },
    data: { status: OrderStatus.CANCELLED },
  });
}

/** Cancel a single PENDING order when it has exceeded the timeout. Returns updated order or null. */
export async function expirePendingOrderIfStale(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || !isPendingOrderExpired(order)) {
    return null;
  }

  const cancelled = await prisma.$transaction((tx) =>
    cancelPendingOrderInTx(tx, order)
  );

  logger.info(
    `Pending order ${orderId} auto-cancelled after ${getOrderPendingTimeoutMinutes()}m timeout`
  );

  return cancelled;
}

/** Cancel all stale PENDING orders for one buyer (used before listing). */
export async function expireStalePendingOrdersForBuyer(
  buyerId: string
): Promise<number> {
  const cutoff = getPendingOrderExpiryCutoff();
  const stale = await prisma.order.findMany({
    where: {
      buyerId,
      status: OrderStatus.PENDING,
      createdAt: { lt: cutoff },
    },
    include: { items: true },
  });

  for (const order of stale) {
    await prisma.$transaction((tx) => cancelPendingOrderInTx(tx, order));
    logger.info(
      `Pending order ${order.id} auto-cancelled (buyer ${buyerId}, timeout)`
    );
  }

  return stale.length;
}

/**
 * Batch expiry for all buyers. Intended for cron-server (Phase 8); exposed for reuse.
 */
export async function expireAllStalePendingOrders(): Promise<number> {
  const cutoff = getPendingOrderExpiryCutoff();
  const stale = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING,
      createdAt: { lt: cutoff },
    },
    include: { items: true },
  });

  for (const order of stale) {
    await prisma.$transaction((tx) => cancelPendingOrderInTx(tx, order));
    logger.info(`Pending order ${order.id} auto-cancelled (batch expiry)`);
  }

  return stale.length;
}

/** Shared cancel path for user-initiated cancel (same product unlock as expiry). */
export async function cancelPendingOrderInTransaction(
  tx: Prisma.TransactionClient,
  order: PendingOrderWithItems
) {
  return cancelPendingOrderInTx(tx, order);
}
