import { Router } from "express";
import { authenticate, authorizeBuyerPortal } from "../../auth/auth.middleware.js";
import { Role } from "../../../types/prisma.js";
import { validate } from "../../../utils/validate.js";
import { createNowPaymentsInvoiceSchema } from "../../../schemas/payment.schemas.js";
import {
  createNowPaymentsInvoiceController,
  nowPaymentsInvoiceLimiter,
  nowPaymentsIpnController,
} from "./nowpayments.controller.js";

const router = Router();

router.post(
  "/create-invoice",
  nowPaymentsInvoiceLimiter,
  authenticate,
  authorizeBuyerPortal(),
  validate(createNowPaymentsInvoiceSchema),
  createNowPaymentsInvoiceController
);

router.post("/ipn", nowPaymentsIpnController);

export default router;
