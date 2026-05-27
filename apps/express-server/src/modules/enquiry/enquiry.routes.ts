import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  authenticate,
  authorize,
  optionalAuthenticate,
} from "../auth/auth.middleware.js";
import { Role } from "../../types/prisma.js";
import { validate } from "../../utils/validate.js";
import { createEnquirySchema } from "../../schemas/enquiry.schemas.js";
import {
  createEnquiryController,
  getMyEnquiriesController,
  getAllEnquiriesController,
  closeEnquiryController,
  deleteEnquiryController,
} from "./enquiry.controller.js";

const router = Router();

const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many enquiries, please try again later." },
});

// POST /api/enquiries — guest or authenticated contact form
router.post(
  "/",
  enquiryLimiter,
  optionalAuthenticate,
  validate(createEnquirySchema),
  createEnquiryController
);

// GET /api/enquiries/mine — user views their own enquiries
router.get("/mine", authenticate, getMyEnquiriesController);

// ---- Admin routes ----

// GET /api/enquiries — admin lists all enquiries
router.get("/", authenticate, authorize([Role.ADMIN]), getAllEnquiriesController);

// PATCH /api/enquiries/:enquiryId/close — admin closes an enquiry
router.patch(
  "/:enquiryId/close",
  authenticate,
  authorize([Role.ADMIN]),
  closeEnquiryController
);

// DELETE /api/enquiries/:enquiryId — admin deletes an enquiry
router.delete(
  "/:enquiryId",
  authenticate,
  authorize([Role.ADMIN]),
  deleteEnquiryController
);

export default router;
