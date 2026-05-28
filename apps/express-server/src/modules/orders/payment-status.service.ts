import { OrderStatus, PaymentStatus } from "../../types/prisma.js";
import { prisma } from "../../lib/prisma.js";
import { orderStatusForPaymentUpdate } from "../../lib/payment-status.js";
import { handleIpnPaymentStatus } from "./payment-lifecycle.service.js";

export async function applyOrderPaymentStatusUpdate(
  orderId: string,
  paymentStatus: PaymentStatus,
  options?: {
    paymentProvider?: string;
    paymentIntent?: string;
    nowpaymentsPaymentId?: string;
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
      ...(options?.nowpaymentsPaymentId
        ? { nowpaymentsPaymentId: options.nowpaymentsPaymentId }
        : {}),
    },
  });
}

/** @deprecated Prefer handleIpnPaymentStatus — delegates to payment lifecycle. */
export async function applyIpnPaymentStatus(
  orderId: string,
  rawPaymentStatus: string | null,
  options?: {
    paymentProvider?: string;
    paymentIntent?: string;
    nowpaymentsPaymentId?: string;
  }
) {
  const legacyOptions = options?.paymentIntent
    ? {
        ...options,
        nowpaymentsPaymentId:
          options.nowpaymentsPaymentId ?? options.paymentIntent,
      }
    : options;

  return handleIpnPaymentStatus(orderId, rawPaymentStatus, legacyOptions);
}
