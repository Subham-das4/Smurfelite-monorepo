import { OrderStatus, PaymentStatus } from "../../types/prisma.js";
import { prisma } from "../../lib/prisma.js";
import logger from "../../utils/logger.js";
import {
  mapIpnPaymentStatus,
  orderStatusForPaymentUpdate,
} from "../../lib/payment-status.js";
import { cancelPendingOrderInTransaction } from "./order-expiry.service.js";
import { fulfillOrder } from "./fulfillment.service.js";

export type NowPaymentsIpnOptions = {
  paymentProvider?: string;
  nowpaymentsPaymentId?: string;
};

async function loadOrderWithItems(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
}

/** Cancel PENDING/PROCESSING order due to failed/expired payment; unlock products. */
export async function cancelOrderDueToPaymentFailure(
  orderId: string,
  options?: NowPaymentsIpnOptions
) {
  const order = await loadOrderWithItems(orderId);
  if (!order) return null;

  if (
    order.status !== OrderStatus.PENDING &&
    order.status !== OrderStatus.PROCESSING
  ) {
    return order;
  }

  return prisma.$transaction(async (tx) => {
    await cancelPendingOrderInTransaction(tx, order);
    return tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        status: OrderStatus.CANCELLED,
        ...(options?.paymentProvider
          ? { paymentProvider: options.paymentProvider }
          : {}),
        ...(options?.nowpaymentsPaymentId
          ? { nowpaymentsPaymentId: options.nowpaymentsPaymentId }
          : {}),
      },
    });
  });
}

/** Mark a completed order as refunded (wallet reversal deferred). */
export async function applyPaymentRefund(
  orderId: string,
  options?: NowPaymentsIpnOptions
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;

  if (order.status === OrderStatus.REFUNDED) {
    return order;
  }

  if (order.status !== OrderStatus.COMPLETED) {
    logger.warn(
      `Refund IPN ignored for order ${orderId} in status ${order.status}`
    );
    return order;
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.REFUNDED,
      paymentStatus: PaymentStatus.REFUNDED,
      ...(options?.paymentProvider
        ? { paymentProvider: options.paymentProvider }
        : {}),
      ...(options?.nowpaymentsPaymentId
        ? { nowpaymentsPaymentId: options.nowpaymentsPaymentId }
        : {}),
    },
  });
}

/** PAID IPN: PROCESSING then fulfill to COMPLETED. Idempotent. */
export async function applyPaymentSuccessAndFulfill(
  orderId: string,
  options?: NowPaymentsIpnOptions
) {
  const order = await loadOrderWithItems(orderId);
  if (!order) return null;

  if (order.status === OrderStatus.COMPLETED) {
    return order;
  }

  if (
    order.status !== OrderStatus.PENDING &&
    order.status !== OrderStatus.PROCESSING
  ) {
    return order;
  }

  if (order.status === OrderStatus.PENDING) {
    const nextOrderStatus = orderStatusForPaymentUpdate(
      PaymentStatus.PAID,
      order.status
    );
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        ...(nextOrderStatus ? { status: nextOrderStatus } : {}),
        ...(options?.paymentProvider
          ? { paymentProvider: options.paymentProvider }
          : {}),
        ...(options?.nowpaymentsPaymentId
          ? { nowpaymentsPaymentId: options.nowpaymentsPaymentId }
          : {}),
      },
    });
  } else if (options?.nowpaymentsPaymentId) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        nowpaymentsPaymentId: options.nowpaymentsPaymentId,
        paymentStatus: PaymentStatus.PAID,
      },
    });
  }

  return fulfillOrder(orderId, options?.paymentProvider ?? "nowpayments");
}

/**
 * Route a mapped IPN payment status to the correct lifecycle handler.
 * Used by smoke tests and the NOWPayments webhook.
 */
export async function handleIpnPaymentStatus(
  orderId: string,
  rawPaymentStatus: string | null,
  options?: NowPaymentsIpnOptions
) {
  const paymentStatus = mapIpnPaymentStatus(rawPaymentStatus);
  if (!paymentStatus) return null;

  const order = await loadOrderWithItems(orderId);
  if (!order) return null;

  if (
    order.status === OrderStatus.CANCELLED ||
    order.status === OrderStatus.REFUNDED
  ) {
    return order;
  }

  if (paymentStatus === PaymentStatus.PAID) {
    if (order.status === OrderStatus.COMPLETED) {
      return order;
    }
    return applyPaymentSuccessAndFulfill(orderId, options);
  }

  if (paymentStatus === PaymentStatus.FAILED) {
    return cancelOrderDueToPaymentFailure(orderId, options);
  }

  if (paymentStatus === PaymentStatus.REFUNDED) {
    return applyPaymentRefund(orderId, options);
  }

  // PENDING — waiting/confirming; no order change
  return order;
}
