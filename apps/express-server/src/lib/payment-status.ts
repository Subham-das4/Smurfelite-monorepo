import { OrderStatus, PaymentStatus } from "../types/prisma.js";

/** Map NOWPayments IPN payment_status strings to internal PaymentStatus. */
export function mapIpnPaymentStatus(
  raw: string | null | undefined
): PaymentStatus | null {
  if (!raw) return null;
  const normalized = raw.toLowerCase().trim();

  if (
    normalized === "finished" ||
    normalized === "confirmed" ||
    normalized === "paid"
  ) {
    return PaymentStatus.PAID;
  }

  if (
    normalized === "failed" ||
    normalized === "expired" ||
    normalized === "refunded" ||
    normalized === "chargeback"
  ) {
    if (normalized === "refunded" || normalized === "chargeback") {
      return PaymentStatus.REFUNDED;
    }
    return PaymentStatus.FAILED;
  }

  if (
    normalized === "waiting" ||
    normalized === "confirming" ||
    normalized === "sending" ||
    normalized === "partially_paid"
  ) {
    return PaymentStatus.PENDING;
  }

  return null;
}

/** Suggested order status when payment status changes (keeps fields aligned). */
export function orderStatusForPaymentUpdate(
  paymentStatus: PaymentStatus,
  currentOrderStatus: OrderStatus
): OrderStatus | undefined {
  if (paymentStatus === PaymentStatus.PAID) {
    if (currentOrderStatus === OrderStatus.PENDING) {
      return OrderStatus.PROCESSING;
    }
    return undefined;
  }

  if (paymentStatus === PaymentStatus.FAILED) {
    if (
      currentOrderStatus === OrderStatus.PENDING ||
      currentOrderStatus === OrderStatus.PROCESSING
    ) {
      return OrderStatus.CANCELLED;
    }
    return undefined;
  }

  if (paymentStatus === PaymentStatus.REFUNDED) {
    if (currentOrderStatus !== OrderStatus.REFUNDED) {
      return OrderStatus.REFUNDED;
    }
  }

  return undefined;
}
