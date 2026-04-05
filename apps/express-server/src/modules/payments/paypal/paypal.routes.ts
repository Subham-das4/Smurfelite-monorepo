// import { Router } from "express";
// import { authenticate, authorize } from "../../auth/auth.middleware.js";
// import { Role } from "@smurfelite/types";
// import { validate } from "../../../utils/validate.js";
// import {
//   createPayPalOrderSchema,
//   capturePayPalOrderSchema,
// } from "../../../schemas/order.schemas.js";
// import {
//   createPayPalOrderController,
//   capturePayPalOrderController,
//   paypalWebhookController,
//   paymentLimiter,
// } from "./paypal.controller.js";

// const router = Router();

// // POST /api/payments/paypal/create-order — Buyer initiates PayPal checkout
// router.post(
//   "/paypal/create-order",
//   paymentLimiter,
//   authenticate,
//   authorize([Role.BUYER]),
//   validate(createPayPalOrderSchema),
//   createPayPalOrderController
// );

// // POST /api/payments/paypal/capture-order — Buyer captures after PayPal approval
// router.post(
//   "/paypal/capture-order",
//   paymentLimiter,
//   authenticate,
//   authorize([Role.BUYER]),
//   validate(capturePayPalOrderSchema),
//   capturePayPalOrderController
// );

// // POST /api/payments/paypal/webhook — PayPal server-to-server events
// router.post("/paypal/webhook", paypalWebhookController);

// export default router;
