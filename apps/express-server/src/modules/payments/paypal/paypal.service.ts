import * as PayPalSdk from "@paypal/paypal-server-sdk";
import { OrderStatus } from "../../../types/prisma.js";
import { prisma } from "../../../lib/prisma.js";
import ApiError from "../../../utils/errors.js";
import logger from "../../../utils/logger.js";
import {
  assertPayPalConfigured,
  getPayPalApiBaseUrl,
  requirePayPalWebhookIdForVerification,
  shouldVerifyPayPalWebhook,
} from "../../../lib/paypal-config.js";
import { getPayPalClient } from "./paypal.provider.js";
import {
  applyPaymentRefund,
  applyPaymentSuccessAndFulfill,
  cancelOrderDueToPaymentFailure,
} from "../../orders/payment-lifecycle.service.js";

const PAYPAL_PROVIDER = "paypal";

function getOrdersController(): PayPalSdk.OrdersController {
  return new PayPalSdk.OrdersController(getPayPalClient());
}

export function assertCapturedAmountMatchesOrder(
  capturedValue: string | undefined,
  orderTotal: number
): void {
  if (!capturedValue) {
    throw new ApiError("PayPal capture amount missing.", 502);
  }
  const captured = parseFloat(capturedValue);
  if (!Number.isFinite(captured)) {
    throw new ApiError("PayPal capture amount invalid.", 502);
  }
  if (Math.abs(captured - orderTotal) > 0.01) {
    throw new ApiError("PayPal capture amount does not match order total.", 400);
  }
}

function extractCaptureAmount(captureResult: {
  purchaseUnits?: Array<{
    payments?: { captures?: Array<{ amount?: { value?: string } }> };
  }>;
}): string | undefined {
  return captureResult.purchaseUnits?.[0]?.payments?.captures?.[0]?.amount
    ?.value;
}

async function loadBuyerOrder(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new ApiError("Order not found.", 404);
  }
  if (order.buyerId !== userId) {
    throw new ApiError("Forbidden.", 403);
  }
  return order;
}

export async function createPayPalOrder(
  internalOrderId: string,
  userId: string
): Promise<{ paypalOrderId: string; status: string }> {
  assertPayPalConfigured();
  const order = await loadBuyerOrder(internalOrderId, userId);

  if (order.status !== OrderStatus.PENDING) {
    throw new ApiError("Only pending orders can be paid.", 400);
  }

  const ordersController = getOrdersController();

  try {
    const { result } = await ordersController.createOrder({
      body: {
        intent: PayPalSdk.CheckoutPaymentIntent.Capture,
        purchaseUnits: [
          {
            referenceId: internalOrderId.slice(0, 256),
            customId: internalOrderId,
            amount: {
              currencyCode: "USD",
              value: order.totalAmount.toFixed(2),
            },
          },
        ],
      },
      prefer: "return=representation",
    });

    if (!result?.id) {
      throw new ApiError("PayPal returned an invalid order response.", 502);
    }

    await prisma.order.update({
      where: { id: internalOrderId },
      data: {
        paypalOrderId: result.id,
        paymentProvider: PAYPAL_PROVIDER,
      },
    });

    logger.info(
      `PayPal order created: ${result.id} for internal order ${internalOrderId}`
    );

    return {
      paypalOrderId: result.id,
      status: result.status ?? "CREATED",
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error("PayPal createOrder error:", error);
    throw new ApiError("Failed to create PayPal order.", 502);
  }
}

export async function capturePayPalOrder(
  paypalOrderId: string,
  internalOrderId: string,
  userId: string
) {
  assertPayPalConfigured();
  const order = await loadBuyerOrder(internalOrderId, userId);

  if (order.status === OrderStatus.COMPLETED) {
    return prisma.order.findUnique({
      where: { id: internalOrderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                gameType: true,
                price: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });
  }

  if (order.status !== OrderStatus.PENDING) {
    throw new ApiError("Only pending orders can be captured.", 400);
  }

  if (order.paypalOrderId !== paypalOrderId) {
    throw new ApiError("PayPal order ID does not match this order.", 400);
  }

  const ordersController = getOrdersController();

  try {
    const { result } = await ordersController.captureOrder({
      id: paypalOrderId,
      prefer: "return=representation",
    });

    if (result?.status !== "COMPLETED") {
      throw new ApiError(
        `PayPal capture returned unexpected status: ${result?.status ?? "unknown"}`,
        402
      );
    }

    assertCapturedAmountMatchesOrder(
      extractCaptureAmount(result),
      order.totalAmount
    );

    const fulfilled = await applyPaymentSuccessAndFulfill(internalOrderId, {
      paymentProvider: PAYPAL_PROVIDER,
    });

    logger.info(
      `PayPal order captured: ${paypalOrderId}. Internal order ${internalOrderId} → COMPLETED`
    );

    return fulfilled;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error("PayPal captureOrder error:", error);
    throw new ApiError("Failed to capture PayPal payment.", 502);
  }
}

export async function verifyPayPalWebhook(
  headers: Record<string, string | string[] | undefined>,
  rawBody: string
): Promise<boolean> {
  if (!shouldVerifyPayPalWebhook()) {
    return true;
  }

  const webhookId = requirePayPalWebhookIdForVerification();
  if (!webhookId) {
    return false;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return false;
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const baseUrl = getPayPalApiBaseUrl();

  const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!tokenRes.ok) {
    logger.error("PayPal webhook verify: token request failed.");
    return false;
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    return false;
  }

  const verifyRes = await fetch(
    `${baseUrl}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: headers["paypal-auth-algo"],
        cert_url: headers["paypal-cert-url"],
        transmission_id: headers["paypal-transmission-id"],
        transmission_sig: headers["paypal-transmission-sig"],
        transmission_time: headers["paypal-transmission-time"],
        webhook_id: webhookId,
        webhook_event: JSON.parse(rawBody),
      }),
    }
  );

  if (!verifyRes.ok) {
    logger.error("PayPal webhook verify: signature API failed.");
    return false;
  }

  const verifyData = (await verifyRes.json()) as {
    verification_status?: string;
  };
  return verifyData.verification_status === "SUCCESS";
}

function resolveInternalOrderIdFromWebhook(
  payload: Record<string, unknown>
): string | null {
  const resource = payload.resource as Record<string, unknown> | undefined;
  if (!resource) return null;

  const customId = resource.custom_id ?? resource.customId;
  if (typeof customId === "string" && customId.length > 0) {
    return customId;
  }

  const purchaseUnits = resource.purchase_units as
    | Array<Record<string, unknown>>
    | undefined;
  const unitCustomId = purchaseUnits?.[0]?.custom_id ?? purchaseUnits?.[0]?.customId;
  if (typeof unitCustomId === "string" && unitCustomId.length > 0) {
    return unitCustomId;
  }

  return null;
}

const FAILURE_EVENTS = new Set([
  "PAYMENT.CAPTURE.DENIED",
  "PAYMENT.CAPTURE.DECLINED",
  "CHECKOUT.PAYMENT.APPROVAL.REVERSED",
]);

export async function processPayPalWebhook(
  payload: Record<string, unknown>
): Promise<void> {
  const eventType =
    typeof payload.event_type === "string" ? payload.event_type : "";

  const orderId = resolveInternalOrderIdFromWebhook(payload);
  if (!orderId) {
    logger.warn(`PayPal webhook ${eventType}: missing internal order id.`);
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    logger.warn(`PayPal webhook for unknown order_id=${orderId}`);
    return;
  }

  if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
    await applyPaymentSuccessAndFulfill(orderId, {
      paymentProvider: PAYPAL_PROVIDER,
    });
    logger.info(`PayPal webhook: order ${orderId} fulfilled via CAPTURE.COMPLETED`);
    return;
  }

  if (eventType === "PAYMENT.CAPTURE.REFUNDED") {
    await applyPaymentRefund(orderId, { paymentProvider: PAYPAL_PROVIDER });
    logger.info(`PayPal webhook: order ${orderId} marked REFUNDED`);
    return;
  }

  if (FAILURE_EVENTS.has(eventType)) {
    await cancelOrderDueToPaymentFailure(orderId, {
      paymentProvider: PAYPAL_PROVIDER,
    });
    logger.info(`PayPal webhook: order ${orderId} cancelled (${eventType})`);
    return;
  }

  logger.info(`PayPal webhook ${eventType} ignored for order ${orderId}`);
}
