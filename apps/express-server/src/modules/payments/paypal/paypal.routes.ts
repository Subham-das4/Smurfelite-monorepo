import { Router } from "express";
import { authenticate, authorizeBuyerPortal } from "../../auth/auth.middleware.js";
import { validate } from "../../../utils/validate.js";
import {
  createPayPalOrderSchema,
  capturePayPalOrderSchema,
} from "../../../schemas/payment.schemas.js";
import {
  capturePayPalOrderController,
  createPayPalOrderController,
  paypalPaymentLimiter,
  paypalStatusController,
} from "./paypal.controller.js";

const router = Router();

router.get("/status", paypalStatusController);

router.post(
  "/create-order",
  paypalPaymentLimiter,
  authenticate,
  authorizeBuyerPortal(),
  validate(createPayPalOrderSchema),
  createPayPalOrderController
);

router.post(
  "/capture-order",
  paypalPaymentLimiter,
  authenticate,
  authorizeBuyerPortal(),
  validate(capturePayPalOrderSchema),
  capturePayPalOrderController
);

export default router;
