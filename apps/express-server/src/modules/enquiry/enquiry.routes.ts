import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
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

router.use(authenticate);

// POST /api/enquiries — any authenticated user submits an enquiry
router.post("/", validate(createEnquirySchema), createEnquiryController);

// GET /api/enquiries/mine — user views their own enquiries
router.get("/mine", getMyEnquiriesController);

// ---- Admin routes ----

// GET /api/enquiries — admin lists all enquiries
router.get("/", authorize([Role.ADMIN]), getAllEnquiriesController);

// PATCH /api/enquiries/:enquiryId/close — admin closes an enquiry
router.patch(
  "/:enquiryId/close",
  authorize([Role.ADMIN]),
  closeEnquiryController
);

// DELETE /api/enquiries/:enquiryId — admin deletes an enquiry
router.delete(
  "/:enquiryId",
  authorize([Role.ADMIN]),
  deleteEnquiryController
);

export default router;
