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

export async function getWalletLedger(
  walletUserId: string,
  page: number = 1,
  pageSize: number = 20
) {
  const skip = (page - 1) * pageSize;
  const where = { walletUserId };

  const [entries, totalCount] = await prisma.$transaction([
    prisma.walletLedger.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.walletLedger.count({ where }),
  ]);

  return {
    entries,
    meta: {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize,
    },
  };
}

export async function listAdminWallets(
  page: number = 1,
  pageSize: number = 20,
  search?: string
) {
  const skip = (page - 1) * pageSize;
  const userWhere =
    search?.trim()
      ? {
          role: Role.SELLER,
          OR: [
            { email: { contains: search.trim(), mode: "insensitive" as const } },
            { name: { contains: search.trim(), mode: "insensitive" as const } },
          ],
        }
      : { role: Role.SELLER };

  const [sellers, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      where: userWhere,
      skip,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        sellerWallet: true,
      },
      orderBy: { email: "asc" },
    }),
    prisma.user.count({ where: userWhere }),
  ]);

  const wallets = sellers.map((s) => ({
    sellerId: s.id,
    sellerEmail: s.email,
    sellerName: s.name,
    pendingBalance: s.sellerWallet?.pendingBalance ?? 0,
    availableBalance: s.sellerWallet?.availableBalance ?? 0,
    frozenBalance: s.sellerWallet?.frozenBalance ?? 0,
    updatedAt: s.sellerWallet?.updatedAt ?? null,
  }));

  return {
    wallets,
    meta: {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize,
    },
  };
}

export async function getAdminWallet(sellerId: string) {
  const user = await prisma.user.findUnique({
    where: { id: sellerId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      sellerWallet: true,
    },
  });
  if (!user) throw new ApiError("Seller not found.", 404);
  if (user.role !== Role.SELLER) {
    throw new ApiError("User is not a seller account.", 400);
  }
  const wallet = user.sellerWallet ?? (await ensureSellerWallet(sellerId));
  return {
    sellerId: user.id,
    sellerEmail: user.email,
    sellerName: user.name,
    ...wallet,
  };
}
