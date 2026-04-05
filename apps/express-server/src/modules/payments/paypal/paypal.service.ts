// import {
//   CheckoutPaymentIntent,
//   OrdersController,
// } from "@paypal/paypal-server-sdk";
// import { paypalClient } from "./paypal.provider.js";
// import { prisma } from "../../../lib/prisma.js";
// import { OrderStatus } from "@smurfelite/types";
// import ApiError from "../../../utils/errors.js";
// import logger from "../../../utils/logger.js";

// const ordersController = new OrdersController(paypalClient);

// /**
//  * Creates a PayPal order linked to an internal Prisma order.
//  * Returns the PayPal order ID to send to the frontend for approval.
//  */
// export const createPayPalOrder = async (
//   internalOrderId: string,
//   totalAmount: number
// ) => {
//   try {
//     const { result } = await ordersController.createOrder({
//       body: {
//         intent: CheckoutPaymentIntent.Capture,
//         purchaseUnits: [
//           {
//             referenceId: internalOrderId,
//             amount: {
//               currencyCode: "USD",
//               value: totalAmount.toFixed(2),
//             },
//           },
//         ],
//       },
//       prefer: "return=representation",
//     });

//     logger.info(
//       `PayPal order created: ${result.id} for internal order: ${internalOrderId}`
//     );
//     return result;
//   } catch (error) {
//     logger.error("PayPal createOrder error:", error);
//     throw new ApiError("Failed to create PayPal order.", 502);
//   }
// };

// /**
//  * Captures a PayPal order after the buyer approves it on the PayPal UI.
//  * On success, updates the internal order status and sets paymentIntent.
//  */
// export const capturePayPalOrder = async (
//   paypalOrderId: string,
//   internalOrderId: string
// ) => {
//   try {
//     const { result } = await ordersController.captureOrder({
//       id: paypalOrderId,
//       prefer: "return=representation",
//     });

//     if (result.status !== "COMPLETED") {
//       throw new ApiError(
//         `PayPal capture returned unexpected status: ${result.status}`,
//         402
//       );
//     }

//     // Update the internal order: record payment intent and set PROCESSING
//     const updatedOrder = await prisma.order.update({
//       where: { id: internalOrderId },
//       data: {
//         status: OrderStatus.PROCESSING,
//         paymentIntent: paypalOrderId,
//         paymentProvider: "paypal",
//       },
//     });

//     logger.info(
//       `PayPal order captured: ${paypalOrderId}. Internal order ${internalOrderId} → PROCESSING`
//     );

//     return updatedOrder;
//   } catch (error) {
//     logger.error("PayPal captureOrder error:", error);
//     if (error instanceof ApiError) throw error;
//     throw new ApiError("Failed to capture PayPal payment.", 502);
//   }
// };

// /**
//  * Verifies an incoming PayPal webhook event using the PayPal REST API.
//  */
// export const verifyPayPalWebhook = async (
//   headers: Record<string, string | string[] | undefined>,
//   rawBody: string
// ): Promise<boolean> => {
//   const webhookId = process.env.PAYPAL_WEBHOOK_ID;
//   if (!webhookId) {
//     logger.warn("PAYPAL_WEBHOOK_ID not configured; skipping webhook verification.");
//     return true;
//   }

//   const auth = Buffer.from(
//     `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
//   ).toString("base64");

//   const tokenRes = await fetch(
//     `${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`,
//     {
//       method: "POST",
//       body: "grant_type=client_credentials",
//       headers: {
//         Authorization: `Basic ${auth}`,
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//     }
//   );
//   const { access_token } = await tokenRes.json();

//   const verifyRes = await fetch(
//     `${process.env.PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`,
//     {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${access_token}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         auth_algo: headers["paypal-auth-algo"],
//         cert_url: headers["paypal-cert-url"],
//         transmission_id: headers["paypal-transmission-id"],
//         transmission_sig: headers["paypal-transmission-sig"],
//         transmission_time: headers["paypal-transmission-time"],
//         webhook_id: webhookId,
//         webhook_event: JSON.parse(rawBody),
//       }),
//     }
//   );

//   const { verification_status } = await verifyRes.json();
//   return verification_status === "SUCCESS";
// };

// /** Legacy helper — kept for backward compatibility */
// export const getPaypalAccessToken = async () => {
//   const auth = Buffer.from(
//     `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
//   ).toString("base64");

//   const response = await fetch(
//     `${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`,
//     {
//       method: "POST",
//       body: "grant_type=client_credentials",
//       headers: {
//         Authorization: `Basic ${auth}`,
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//     }
//   );

//   const data = await response.json();
//   return data.access_token;
// };
