import { DisputeStatus, OrderStatus } from "../../types/prisma.js";
import { prisma } from "../../lib/prisma.js";
import ApiError from "../../utils/errors.js";
import {
  computeDisputeFreezeAmount,
  freezeWalletForDispute,
  releaseFrozenForDisputeResolution,
} from "./dispute.wallet.js";

const ACTIVE_DISPUTE_STATUSES: DisputeStatus[] = [
  DisputeStatus.OPEN,
  DisputeStatus.UNDER_REVIEW,
];

const TERMINAL_DISPUTE_STATUSES: DisputeStatus[] = [
  DisputeStatus.RESOLVED_BUYER,
  DisputeStatus.RESOLVED_SELLER,
  DisputeStatus.CLOSED,
];

export interface CreateDisputeInput {
  orderId: string;
  reason: string;
  details?: Record<string, unknown>;
}

export interface AdminDisputeFilters {
  status?: DisputeStatus;
  buyerId?: string;
  sellerId?: string;
  orderId?: string;
  page?: number;
  pageSize?: number;
}

function buildOrderSnapshot(order: {
  id: string;
  totalAmount: number;
  createdAt: Date;
  items: Array<{
    productId: string;
    priceAtPurchase: number;
    quantity: number;
    product: {
      id: string;
      title: string;
      gameType: string;
      sellerId: string;
    };
  }>;
}) {
  return {
    orderId: order.id,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      productId: item.productId,
      title: item.product.title,
      gameType: item.product.gameType,
      sellerId: item.product.sellerId,
      priceAtPurchase: item.priceAtPurchase,
      quantity: item.quantity,
    })),
  };
}

function resolveSellerId(
  order: {
    items: Array<{
      productId: string;
      product: { sellerId: string };
    }>;
  },
  productId?: string
): string {
  if (productId) {
    const item = order.items.find((entry) => entry.productId === productId);
    if (!item) {
      throw new ApiError("Product is not part of this order.", 400);
    }
    return item.product.sellerId;
  }

  if (order.items.length === 0) {
    throw new ApiError("Order has no items to dispute.", 400);
  }

  return order.items[0]!.product.sellerId;
}

export const createDispute = async (
  buyerId: string,
  input: CreateDisputeInput
) => {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              gameType: true,
              sellerId: true,
            },
          },
        },
      },
      disputes: {
        where: { status: { in: ACTIVE_DISPUTE_STATUSES } },
        select: { id: true },
      },
    },
  });

  if (!order) {
    throw new ApiError("Order not found.", 404);
  }

  if (order.buyerId !== buyerId) {
    throw new ApiError("Forbidden: You do not own this order.", 403);
  }

  if (order.status !== OrderStatus.COMPLETED) {
    throw new ApiError("Only COMPLETED orders can be disputed.", 400);
  }

  if (order.disputes.length > 0) {
    throw new ApiError("An active dispute already exists for this order.", 400);
  }

  const productId =
    typeof input.details?.productId === "string"
      ? input.details.productId
      : undefined;
  const sellerId = resolveSellerId(order, productId);
  const orderSnapshot = buildOrderSnapshot(order);
  const freezeAmount = computeDisputeFreezeAmount(order, sellerId, productId);

  return prisma.$transaction(async (tx) => {
    const dispute = await tx.dispute.create({
      data: {
        orderId: order.id,
        buyerId,
        sellerId,
        reason: input.reason.trim(),
        details: {
          ...(input.details ?? {}),
          orderSnapshot,
          frozenAmount: freezeAmount,
        },
      },
    });

    const frozen = await freezeWalletForDispute(tx, {
      sellerId,
      orderId: order.id,
      disputeId: dispute.id,
      amount: freezeAmount,
    });

    if (frozen !== freezeAmount) {
      await tx.dispute.update({
        where: { id: dispute.id },
        data: {
          details: {
            ...(input.details ?? {}),
            orderSnapshot,
            frozenAmount: frozen,
          },
        },
      });
    }

    return tx.dispute.findUniqueOrThrow({ where: { id: dispute.id } });
  });
};

export const getMyDisputes = async (userId: string) => {
  return prisma.dispute.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getAdminDisputes = async (filters: AdminDisputeFilters) => {
  const page = filters.page ?? 1;
  const pageSize = Math.min(filters.pageSize ?? 20, 100);
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.buyerId) where.buyerId = filters.buyerId;
  if (filters.sellerId) where.sellerId = filters.sellerId;
  if (filters.orderId) where.orderId = filters.orderId;

  const [disputes, totalCount] = await prisma.$transaction([
    prisma.dispute.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        buyer: { select: { id: true, email: true, name: true } },
        seller: { select: { id: true, email: true, name: true } },
        order: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.dispute.count({ where }),
  ]);

  return {
    disputes,
    meta: {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize,
    },
  };
};

const ALLOWED_STATUS_TRANSITIONS: Partial<
  Record<DisputeStatus, DisputeStatus[]>
> = {
  [DisputeStatus.OPEN]: [
    DisputeStatus.UNDER_REVIEW,
    DisputeStatus.RESOLVED_BUYER,
    DisputeStatus.RESOLVED_SELLER,
    DisputeStatus.CLOSED,
  ],
  [DisputeStatus.UNDER_REVIEW]: [
    DisputeStatus.RESOLVED_BUYER,
    DisputeStatus.RESOLVED_SELLER,
    DisputeStatus.CLOSED,
  ],
};

export const updateDisputeStatus = async (
  disputeId: string,
  nextStatus: DisputeStatus
) => {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
  });

  if (!dispute) {
    throw new ApiError("Dispute not found.", 404);
  }

  if (TERMINAL_DISPUTE_STATUSES.includes(dispute.status)) {
    throw new ApiError("This dispute is already resolved.", 400);
  }

  const allowed = ALLOWED_STATUS_TRANSITIONS[dispute.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new ApiError(
      `Cannot transition dispute from ${dispute.status} to ${nextStatus}.`,
      400
    );
  }

  const needsWalletRelease =
    nextStatus === DisputeStatus.RESOLVED_BUYER ||
    nextStatus === DisputeStatus.RESOLVED_SELLER ||
    nextStatus === DisputeStatus.CLOSED;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.dispute.update({
      where: { id: disputeId },
      data: { status: nextStatus },
      include: {
        buyer: { select: { id: true, email: true, name: true } },
        seller: { select: { id: true, email: true, name: true } },
        order: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            paymentStatus: true,
          },
        },
      },
    });

    if (needsWalletRelease) {
      const favorSeller =
        nextStatus === DisputeStatus.RESOLVED_SELLER ||
        nextStatus === DisputeStatus.CLOSED;
      await releaseFrozenForDisputeResolution(tx, {
        sellerId: dispute.sellerId,
        disputeId: dispute.id,
        orderId: dispute.orderId,
        favorSeller,
      });
    }

    return updated;
  });
};
