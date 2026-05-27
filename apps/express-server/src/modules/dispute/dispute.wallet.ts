import { WalletLedgerType } from "../../types/prisma.js";
import type * as PrismaNamespace from "../../types/prisma.js";
import ApiError from "../../utils/errors.js";

type Tx = PrismaNamespace.Prisma.TransactionClient;

export function computeDisputeFreezeAmount(
  order: {
    items: Array<{
      productId: string;
      priceAtPurchase: number;
      quantity: number;
      product: { sellerId: string };
    }>;
  },
  sellerId: string,
  productId?: string
): number {
  if (productId) {
    const item = order.items.find((entry) => entry.productId === productId);
    if (!item || item.product.sellerId !== sellerId) return 0;
    return item.priceAtPurchase * item.quantity;
  }

  return order.items
    .filter((item) => item.product.sellerId === sellerId)
    .reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);
}

export async function freezeWalletForDispute(
  tx: Tx,
  params: {
    sellerId: string;
    orderId: string;
    disputeId: string;
    amount: number;
  }
): Promise<number> {
  const { sellerId, orderId, disputeId, amount } = params;
  if (amount <= 0) return 0;

  const wallet = await tx.sellerWallet.findUnique({
    where: { userId: sellerId },
  });
  if (!wallet) {
    throw new ApiError("Seller wallet not found for dispute freeze.", 400);
  }

  const freezeAmount = Math.min(amount, wallet.pendingBalance);
  if (freezeAmount <= 0) return 0;

  await tx.sellerWallet.update({
    where: { userId: sellerId },
    data: {
      pendingBalance: { decrement: freezeAmount },
      frozenBalance: { increment: freezeAmount },
    },
  });

  await tx.walletLedger.create({
    data: {
      walletUserId: sellerId,
      type: WalletLedgerType.DISPUTE_FREEZE,
      amount: freezeAmount,
      orderId,
      disputeId,
      note: "Funds frozen for open dispute",
    },
  });

  return freezeAmount;
}

export async function getFrozenAmountForDispute(
  tx: Tx,
  disputeId: string
): Promise<number> {
  const entries = await tx.walletLedger.findMany({
    where: {
      disputeId,
      type: WalletLedgerType.DISPUTE_FREEZE,
    },
  });
  const released = await tx.walletLedger.findMany({
    where: {
      disputeId,
      type: WalletLedgerType.DISPUTE_RELEASE,
    },
  });
  const frozen = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const releasedSum = released.reduce((sum, entry) => sum + entry.amount, 0);
  return Math.max(0, frozen - releasedSum);
}

export async function releaseFrozenForDisputeResolution(
  tx: Tx,
  params: {
    sellerId: string;
    disputeId: string;
    orderId: string;
    favorSeller: boolean;
  }
): Promise<void> {
  const amount = await getFrozenAmountForDispute(tx, params.disputeId);
  if (amount <= 0) return;

  const wallet = await tx.sellerWallet.findUnique({
    where: { userId: params.sellerId },
  });
  if (!wallet) return;

  if (params.favorSeller) {
    await tx.sellerWallet.update({
      where: { userId: params.sellerId },
      data: {
        frozenBalance: { decrement: amount },
        pendingBalance: { increment: amount },
      },
    });
    await tx.walletLedger.create({
      data: {
        walletUserId: params.sellerId,
        type: WalletLedgerType.DISPUTE_RELEASE,
        amount,
        orderId: params.orderId,
        disputeId: params.disputeId,
        note: "Dispute resolved in favor of seller",
      },
    });
    return;
  }

  await tx.sellerWallet.update({
    where: { userId: params.sellerId },
    data: {
      frozenBalance: { decrement: amount },
    },
  });
  await tx.walletLedger.create({
    data: {
      walletUserId: params.sellerId,
      type: WalletLedgerType.ADJUSTMENT,
      amount: -amount,
      orderId: params.orderId,
      disputeId: params.disputeId,
      note: "Dispute resolved in favor of buyer",
    },
  });
}
