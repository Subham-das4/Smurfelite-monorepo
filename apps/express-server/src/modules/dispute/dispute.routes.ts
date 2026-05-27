import { Router, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { Role } from "../../types/prisma.js";
import { validate } from "../../utils/validate.js";
import { createDisputeSchema } from "../../schemas/dispute.schemas.js";
import {
  createDisputeController,
  getMyDisputesController,
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

// POST /api/disputes — buyer opens a dispute on a COMPLETED order
router.post(
  "/",
  disputeLimiter,
  validate(createDisputeSchema),
  createDisputeController
);

// GET /api/disputes/mine — buyer/seller views their disputes
router.get("/mine", getMyDisputesController);

// GET /api/disputes — admin list (Phase 5)
router.get("/", authorize([Role.ADMIN]), (_req: Request, res: Response) => {
  res.status(501).json({
    message: "Admin disputes list not implemented yet.",
    phase: 5,
  });
});

export default router;
