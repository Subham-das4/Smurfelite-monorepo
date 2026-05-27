import { OrderStatus, PaymentStatus } from "../../types/prisma.js";
import { prisma } from "../../lib/prisma.js";
import {
  mapIpnPaymentStatus,
  orderStatusForPaymentUpdate,
} from "../../lib/payment-status.js";

export async function applyOrderPaymentStatusUpdate(
  orderId: string,
  paymentStatus: PaymentStatus,
  options?: {
    paymentProvider?: string;
    paymentIntent?: string;
    orderStatus?: OrderStatus;
  }
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;

  const nextOrderStatus =
    options?.orderStatus ??
    orderStatusForPaymentUpdate(paymentStatus, order.status);

  return prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus,
      ...(nextOrderStatus ? { status: nextOrderStatus } : {}),
      ...(options?.paymentProvider
        ? { paymentProvider: options.paymentProvider }
        : {}),
      ...(options?.paymentIntent
        ? { paymentIntent: options.paymentIntent }
        : {}),
    },
  });
}

export async function applyIpnPaymentStatus(
  orderId: string,
  rawPaymentStatus: string | null,
  options?: { paymentProvider?: string; paymentIntent?: string }
) {
  const paymentStatus = mapIpnPaymentStatus(rawPaymentStatus);
  if (!paymentStatus) return null;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;

  if (
    order.status === OrderStatus.COMPLETED ||
    order.status === OrderStatus.CANCELLED ||
    order.status === OrderStatus.REFUNDED
  ) {
    if (paymentStatus === PaymentStatus.PAID && order.paymentStatus !== PaymentStatus.PAID) {
      return applyOrderPaymentStatusUpdate(orderId, PaymentStatus.PAID, options);
    }
    return order;
  }

  return applyOrderPaymentStatusUpdate(orderId, paymentStatus, options);
}
