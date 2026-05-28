import { OrderStatus } from "../../../types/prisma.js";
import { prisma } from "../../../lib/prisma.js";
import ApiError from "../../../utils/errors.js";
import logger from "../../../utils/logger.js";
import { createInvoice, NowPaymentsApiError } from "./nowpayments.client.js";
import { verifyNowPaymentsIpnSignature } from "./nowpayments.verify.js";
import { handleIpnPaymentStatus } from "../../orders/payment-lifecycle.service.js";
import { mapIpnPaymentStatus } from "../../../lib/payment-status.js";

function getPublicApiBase(): string {
  const raw = process.env.PUBLIC_API_BASE_URL?.trim();
  if (!raw) {
    throw new ApiError(
      "PUBLIC_API_BASE_URL is not set (required for IPN callback URL).",
      500
    );
  }
  return raw.replace(/\/$/, "");
}

function getFrontendBase(): string {
  const raw = process.env.FRONTEND_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

function getIpnSecret(): string {
  const s = process.env.NOWPAYMENTS_IPN_SECRET?.trim();
  if (!s) {
    throw new ApiError("NOWPAYMENTS_IPN_SECRET is not configured.", 500);
  }
  return s;
}

export async function createInvoiceForOrder(
  orderId: string,
  userId: string
): Promise<{ invoiceUrl: string; invoiceId: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });

  if (!order) {
    throw new ApiError("Order not found.", 404);
  }
  if (order.buyerId !== userId) {
    throw new ApiError("Forbidden.", 403);
  }
  if (order.status !== OrderStatus.PENDING) {
    throw new ApiError(
      "Only pending orders can be paid.",
      400
    );
  }

  const publicBase = getPublicApiBase();
  const frontendBase = getFrontendBase();
  const ipnUrl = `${publicBase}/api/payments/nowpayments/ipn`;
  const titlePreview = order.items
    .map((i) => i.product.title)
    .slice(0, 3)
    .join(", ");
  const description =
    order.items.length > 3
      ? `${titlePreview} (+${order.items.length - 3} more)`
      : titlePreview || "SmurfElite order";

  let invoice;
  try {
    invoice = await createInvoice({
      price_amount: order.totalAmount,
      price_currency: "usd",
      ipn_callback_url: ipnUrl,
      order_id: order.id,
      order_description: description.slice(0, 200),
      success_url: `${frontendBase}/checkout/success?orderId=${encodeURIComponent(order.id)}`,
      cancel_url: `${frontendBase}/checkout/cancel?orderId=${encodeURIComponent(order.id)}`,
    });
  } catch (e) {
    if (e instanceof NowPaymentsApiError) {
      logger.error("NOWPayments createInvoice failed:", e.message, e.body);
      throw new ApiError(e.message, e.status >= 400 && e.status < 600 ? e.status : 502);
    }
    throw e;
  }

  const invoiceId = String(invoice.id);

  await prisma.order.update({
    where: { id: orderId },
    data: {
      nowpaymentsInvoiceId: invoiceId,
      paymentProvider: "nowpayments",
    },
  });

  return { invoiceUrl: invoice.invoice_url, invoiceId };
}

function getOrderIdFromIpn(payload: Record<string, unknown>): string | null {
  const raw = payload.order_id ?? payload.orderId;
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (typeof raw === "number") return String(raw);
  return null;
}

function getPaymentIdString(payload: Record<string, unknown>): string | null {
  const raw = payload.payment_id ?? payload.paymentId;
  if (raw === undefined || raw === null) return null;
  return String(raw);
}

function getPaymentStatus(payload: Record<string, unknown>): string | null {
  const raw = payload.payment_status ?? payload.paymentStatus;
  return typeof raw === "string" ? raw : null;
}

export async function processNowPaymentsIpn(
  payload: Record<string, unknown>,
  signatureHeader: string | undefined
): Promise<void> {
  const ipnSecret = getIpnSecret();
  if (!verifyNowPaymentsIpnSignature(payload, signatureHeader, ipnSecret)) {
    throw new ApiError("Invalid IPN signature.", 401);
  }

  const orderId = getOrderIdFromIpn(payload);
  if (!orderId) {
    logger.warn("NOWPayments IPN missing order_id.");
    return;
  }

  const rawPaymentStatus = getPaymentStatus(payload);
  const paymentId = getPaymentIdString(payload);
  const mapped = mapIpnPaymentStatus(rawPaymentStatus);

  if (!mapped) {
    logger.info(
      `NOWPayments IPN: order ${orderId} unmapped status=${rawPaymentStatus ?? "null"}`
    );
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    logger.warn(`NOWPayments IPN for unknown order_id=${orderId}`);
    return;
  }

  if (
    order.status === OrderStatus.CANCELLED ||
    order.status === OrderStatus.REFUNDED
  ) {
    logger.info(
      `NOWPayments IPN: order ${orderId} terminal status ${order.status}, ignoring`
    );
    return;
  }

  const updated = await handleIpnPaymentStatus(orderId, rawPaymentStatus, {
    paymentProvider: "nowpayments",
    nowpaymentsPaymentId: paymentId ?? undefined,
  });

  if (updated) {
    logger.info(
      `NOWPayments IPN: order ${orderId} paymentStatus=${updated.paymentStatus} status=${updated.status}`
    );
  }
}
