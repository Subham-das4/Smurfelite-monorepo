import { ORDER_SERVICE_FEE_USD } from "../../constants/order-pricing.js";
import { OrderStatus } from "../../types/prisma.js";
import { prisma } from "../../lib/prisma.js";
import { decrypt } from "../../services/encryption.service.js";
import ApiError from "../../utils/errors.js";
import { isProductPurchasable } from "../product/product.constants.js";
import {
  cancelPendingOrderInTransaction,
  expireAllStalePendingOrders,
  expirePendingOrderIfStale,
  expireStalePendingOrdersForBuyer,
} from "./order-expiry.service.js";

export const createOrder = async (userId: string, productIds: string[]) => {
  const itemMap = productIds.reduce(
    (acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const uniqueIds = Object.keys(itemMap);

  return await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: uniqueIds } },
    });

    if (products.length !== uniqueIds.length) {
      throw new ApiError("One or more products no longer exist.", 404);
    }

    const unavailable = products.filter((p) => !isProductPurchasable(p));
    if (unavailable.length > 0) {
      const names = unavailable.map((p) => p.title).join(", ");
      throw new ApiError(
        `The following items are no longer available: ${names}`,
        400
      );
    }

    const productSum = products.reduce((sum, p) => {
      return sum + p.price * itemMap[p.id];
    }, 0);
    const totalAmount = productSum + ORDER_SERVICE_FEE_USD;

    const order = await tx.order.create({
      data: {
        totalAmount,
        buyerId: userId,
        items: {
          create: products.map((p) => ({
            productId: p.id,
            priceAtPurchase: p.price,
            quantity: itemMap[p.id],
          })),
        },
      },
      include: { items: true },
    });

    await tx.product.updateMany({
      where: { id: { in: uniqueIds } },
      data: { transactionBlock: true },
    });

    return order;
  });
};

export const getOrderById = async (orderId: string, userId: string, isAdmin: boolean) => {
  await expirePendingOrderIfStale(orderId);

  const order = await prisma.order.findUnique({
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
              specifications: true,
            },
          },
        },
      },
    },
  });

  if (!order) throw new ApiError("Order not found.", 404);

  if (!isAdmin && order.buyerId !== userId) {
    throw new ApiError("Forbidden: You do not own this order.", 403);
  }

  return order;
};

export const getBuyerOrders = async (userId: string) => {
  await expireStalePendingOrdersForBuyer(userId);

  return prisma.order.findMany({
    where: { buyerId: userId },
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
    orderBy: { createdAt: "desc" },
  });
};

export const getAllOrders = async (page: number = 1, pageSize: number = 20) => {
  await expireAllStalePendingOrders();

  const skip = (page - 1) * pageSize;
  const [orders, totalCount] = await prisma.$transaction([
    prisma.order.findMany({
      skip,
      take: pageSize,
      include: {
        buyer: { select: { id: true, email: true, name: true } },
        items: { include: { product: { select: { id: true, title: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count(),
  ]);

  return {
    orders,
    meta: {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize,
    },
  };
};

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus
) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError("Order not found.", 404);

  return prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
};

export const cancelOrder = async (orderId: string, userId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw new ApiError("Order not found.", 404);
  if (order.buyerId !== userId)
    throw new ApiError("Forbidden: You do not own this order.", 403);
  if (order.status !== OrderStatus.PENDING) {
    throw new ApiError(
      "Only PENDING orders can be cancelled.",
      400
    );
  }

  return prisma.$transaction(async (tx) => {
    return cancelPendingOrderInTransaction(tx, order);
  });
};

export const getOrderCredentials = async (orderId: string, userId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!order) throw new ApiError("Order not found.", 404);
  if (order.buyerId !== userId)
    throw new ApiError("Forbidden: You do not own this order.", 403);
  if (order.status !== OrderStatus.COMPLETED) {
    throw new ApiError(
      "Credentials are only available for COMPLETED orders.",
      403
    );
  }

  const credentials = order.items.map((item) => {
    const p = item.product;
    return {
      productId: p.id,
      title: p.title,
      gameType: p.gameType,
      accountUsername: decrypt(Buffer.from(p.accountUsername)),
      accountPassword: decrypt(Buffer.from(p.accountPassword)),
      accountEmail: decrypt(Buffer.from(p.accountEmail)),
      accountEmailPassword: decrypt(Buffer.from(p.accountEmailPassword)),
    };
  });

  return { orderId, credentials };
};
