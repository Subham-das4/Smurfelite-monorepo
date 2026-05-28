import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { Role } from "../../types/prisma.js";
import { validate } from "../../utils/validate.js";
import {
  createSellerSchema,
  rejectSellerSchema,
} from "./seller.schemas.js";
import {
  createSellerController,
  listSellersController,
  approveSellerController,
  rejectSellerController,
} from "./seller.controller.js";

const router = Router();

router.use(authenticate, authorize([Role.ADMIN]));

router.get("/", listSellersController);
router.post("/", validate(createSellerSchema), createSellerController);
router.patch("/:sellerId/approve", approveSellerController);
router.patch(
  "/:sellerId/reject",
  validate(rejectSellerSchema),
  rejectSellerController
);

export default router;
