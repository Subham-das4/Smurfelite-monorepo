import { DisputeStatus, OrderStatus } from "../../types/prisma.js";
import { prisma } from "../../lib/prisma.js";
import ApiError from "../../utils/errors.js";

const ACTIVE_DISPUTE_STATUSES: DisputeStatus[] = [
  DisputeStatus.OPEN,
  DisputeStatus.UNDER_REVIEW,
];

export interface CreateDisputeInput {
  orderId: string;
  reason: string;
  details?: Record<string, unknown>;
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
    throw new ApiError(
      "Only COMPLETED orders can be disputed.",
      400
    );
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

  return prisma.dispute.create({
    data: {
      orderId: order.id,
      buyerId,
      sellerId,
      reason: input.reason.trim(),
      details: {
        ...(input.details ?? {}),
        orderSnapshot,
      },
    },
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
