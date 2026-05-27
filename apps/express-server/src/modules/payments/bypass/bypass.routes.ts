import { Router } from "express";
import { authenticate, authorize } from "../../auth/auth.middleware.js";
import { Role } from "../../../types/prisma.js";
import { validate } from "../../../utils/validate.js";
import { completeBypassPaymentSchema } from "../../../schemas/payment.schemas.js";
import {
  bypassStatusController,
  completeBypassPaymentController,
} from "./bypass.controller.js";

const router = Router();

router.get("/status", bypassStatusController);

router.post(
  "/complete",
  authenticate,
  authorize([Role.BUYER]),
  validate(completeBypassPaymentSchema),
  completeBypassPaymentController
);

export default router;
