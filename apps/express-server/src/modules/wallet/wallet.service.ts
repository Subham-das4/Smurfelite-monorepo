import { Role, WalletLedgerType } from "../../types/prisma.js";
import { prisma } from "../../lib/prisma.js";
import ApiError from "../../utils/errors.js";

export async function ensureSellerWallet(userId: string) {
  return prisma.sellerWallet.upsert({
    where: { userId },
    create: {
      userId,
      pendingBalance: 0,
      availableBalance: 0,
      frozenBalance: 0,
    },
    update: {},
  });
}

export async function getWalletForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) throw new ApiError("User not found.", 404);
  if (user.role !== Role.SELLER) {
    throw new ApiError("Wallet is only available for seller accounts.", 403);
  }

  const wallet = await ensureSellerWallet(userId);
  return wallet;
}

export async function recordSellerPayout(
  sellerId: string,
  amount: number,
  note?: string
) {
  if (amount <= 0) {
    throw new ApiError("Payout amount must be positive.", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { role: true },
  });
  if (!user) throw new ApiError("Seller not found.", 404);
  if (user.role !== Role.SELLER) {
    throw new ApiError("Payouts can only be recorded for seller accounts.", 400);
  }

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.sellerWallet.findUnique({
      where: { userId: sellerId },
    });
    if (!wallet) {
      throw new ApiError("Seller wallet not found.", 404);
    }
    if (wallet.availableBalance < amount) {
      throw new ApiError("Insufficient available balance for payout.", 400);
    }

    const updated = await tx.sellerWallet.update({
      where: { userId: sellerId },
      data: { availableBalance: { decrement: amount } },
    });

    await tx.walletLedger.create({
      data: {
        walletUserId: sellerId,
        type: WalletLedgerType.PAYOUT,
        amount,
        note: note?.trim() || "Admin manual payout",
      },
    });

    return updated;
  });
}
