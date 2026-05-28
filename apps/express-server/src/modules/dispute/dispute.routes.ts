import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  authenticate,
  authorize,
  authorizeBuyerPortal,
} from "../auth/auth.middleware.js";
import { Role } from "../../types/prisma.js";
import { validate } from "../../utils/validate.js";
import {
  createDisputeSchema,
  updateDisputeStatusSchema,
} from "../../schemas/dispute.schemas.js";
import {
  createDisputeController,
  getMyDisputesController,
  getAdminDisputesController,
  updateDisputeStatusController,
} from "./dispute.controller.js";

const router = Router();

const disputeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many dispute requests, please try again later." },
});

router.use(authenticate);

router.post(
  "/",
  disputeLimiter,
  authorizeBuyerPortal(),
  validate(createDisputeSchema),
  createDisputeController
);

router.get("/mine", authorizeBuyerPortal(), getMyDisputesController);

router.get("/", authorize([Role.ADMIN]), getAdminDisputesController);

router.patch(
  "/:disputeId/status",
  authorize([Role.ADMIN]),
  validate(updateDisputeStatusSchema),
  updateDisputeStatusController
);

export default router;
