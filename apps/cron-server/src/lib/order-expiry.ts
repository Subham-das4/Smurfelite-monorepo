import {
  OrderStatus,
  type Prisma,
  type PrismaClient,
} from "@smurfelite/types/src/generated/prisma/index.js";
import type { Logger } from "winston";
import { getPendingOrderExpiryCutoff } from "./order-pending-timeout.js";

type PendingOrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

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

/** Batch expiry for stale PENDING orders (aligned with express-server order-expiry.service). */
export async function expireAllStalePendingOrders(
  prisma: PrismaClient,
  orderPendingTimeoutMinutes: number,
  logger: Logger
): Promise<number> {
  const cutoff = getPendingOrderExpiryCutoff(orderPendingTimeoutMinutes);
  const stale = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING,
      createdAt: { lt: cutoff },
    },
    include: { items: true },
  });

  for (const order of stale) {
    await prisma.$transaction((tx) => cancelPendingOrderInTx(tx, order));
    logger.info(`Pending order ${order.id} auto-cancelled (cron batch expiry)`);
  }

  return stale.length;
}
