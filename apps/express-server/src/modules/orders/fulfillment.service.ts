import {
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  WalletLedgerType,
} from "../../types/prisma.js";
import { prisma } from "../../lib/prisma.js";
import ApiError from "../../utils/errors.js";

/**
 * Completes a paid order: marks products sold and credits seller wallets.
 * Idempotent if order is already COMPLETED.
 */
export async function fulfillOrder(
  orderId: string,
  paymentProvider: string
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { select: { id: true, sellerId: true } } } },
      },
    });

    if (!order) {
      throw new ApiError("Order not found.", 404);
    }

    if (order.status === OrderStatus.COMPLETED) {
      return order;
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new ApiError(
        "Only PENDING orders can be fulfilled.",
        400
      );
    }

    const productIds = order.items.map((i) => i.productId);

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        paymentProvider,
      },
    });

    await tx.product.updateMany({
      where: { id: { in: productIds } },
      data: {
        status: ProductStatus.SOLD,
        isAvailable: false,
        transactionBlock: false,
      },
    });

    for (const item of order.items) {
      const credit = item.priceAtPurchase * item.quantity;
      const sellerId = item.product.sellerId;

      await tx.sellerWallet.upsert({
        where: { userId: sellerId },
        create: {
          userId: sellerId,
          pendingBalance: credit,
          availableBalance: 0,
          frozenBalance: 0,
        },
        update: {
          pendingBalance: { increment: credit },
        },
      });

      await tx.walletLedger.create({
        data: {
          walletUserId: sellerId,
          type: WalletLedgerType.SALE_CREDIT,
          amount: credit,
          orderId: order.id,
          note: `Sale: ${item.productId}`,
        },
      });
    }

    return tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                gameType: true,
                price: true,
              },
            },
          },
        },
      },
    });
  });
}
