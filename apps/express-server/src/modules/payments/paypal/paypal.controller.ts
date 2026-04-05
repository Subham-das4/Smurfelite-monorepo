// import { Request, Response, NextFunction } from "express";
// import { AuthenticatedRequest } from "../../../types/auth.types.js";
// import { rateLimit } from "express-rate-limit";
// import {
//   createPayPalOrder,
//   capturePayPalOrder,
//   verifyPayPalWebhook,
// } from "./paypal.service.js";
// import { prisma } from "../../../lib/prisma.js";
// import { OrderStatus } from "@smurfelite/types";
// import ApiError from "../../../utils/errors.js";
// import logger from "../../../utils/logger.js";

// export const paymentLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 30,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: { message: "Too many payment requests, please try again later." },
// });

// /**
//  * POST /api/payments/paypal/create-order
//  * Body: { internalOrderId: string }
//  */
// export const createPayPalOrderController = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { user } = req as unknown as AuthenticatedRequest;
//     const { internalOrderId } = req.body;
//     if (!internalOrderId) {
//       throw new ApiError("internalOrderId is required.", 400);
//     }

//     const order = await prisma.order.findUnique({
//       where: { id: internalOrderId },
//     });

//     if (!order) throw new ApiError("Order not found.", 404);
//     if (order.buyerId !== user.id)
//       throw new ApiError("Forbidden: You do not own this order.", 403);
//     if (order.status !== OrderStatus.PENDING) {
//       throw new ApiError("Only PENDING orders can be paid for.", 400);
//     }

//     const paypalOrder = await createPayPalOrder(
//       internalOrderId,
//       order.totalAmount
//     );

//     res.status(201).json({
//       paypalOrderId: paypalOrder.id,
//       status: paypalOrder.status,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * POST /api/payments/paypal/capture-order
//  * Body: { paypalOrderId: string, internalOrderId: string }
//  */
// export const capturePayPalOrderController = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { user } = req as unknown as AuthenticatedRequest;
//     const { paypalOrderId, internalOrderId } = req.body;
//     if (!paypalOrderId || !internalOrderId) {
//       throw new ApiError(
//         "paypalOrderId and internalOrderId are required.",
//         400
//       );
//     }

//     const order = await prisma.order.findUnique({
//       where: { id: internalOrderId },
//     });

//     if (!order) throw new ApiError("Order not found.", 404);
//     if (order.buyerId !== user.id)
//       throw new ApiError("Forbidden: You do not own this order.", 403);

//     const updatedOrder = await capturePayPalOrder(
//       paypalOrderId,
//       internalOrderId
//     );

//     res.status(200).json({
//       message: "Payment captured. Your order is being processed.",
//       order: updatedOrder,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * POST /api/payments/paypal/webhook
//  */
// export const paypalWebhookController = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const rawBody = JSON.stringify(req.body);
//     const isValid = await verifyPayPalWebhook(
//       req.headers as Record<string, string>,
//       rawBody
//     );

//     if (!isValid) {
//       logger.warn("PayPal webhook signature verification failed.");
//       return res.status(400).json({ message: "Invalid webhook signature." });
//     }

//     const eventType: string = req.body.event_type;
//     logger.info(`PayPal webhook received: ${eventType}`);

//     if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
//       const referenceId: string =
//         req.body.resource?.purchase_units?.[0]?.reference_id;

//       if (referenceId) {
//         await prisma.order.updateMany({
//           where: {
//             id: referenceId,
//             status: OrderStatus.PROCESSING,
//           },
//           data: { status: OrderStatus.COMPLETED },
//         });
//         logger.info(`Order ${referenceId} marked as COMPLETED via webhook.`);
//       }
//     }

//     res.status(200).json({ received: true });
//   } catch (error) {
//     next(error);
//   }
// };
