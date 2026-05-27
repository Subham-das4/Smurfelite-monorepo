import { Router } from "express";
import {
  createProductController,
  updateProductController,
  deleteProductController,
  getProductDetailsController,
  getAllProductsController,
  publishProductController,
  delistProductController,
  reactivateProductController,
  banProductController,
  liftBanProductController,
} from "./product.controller.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { Role } from "../../types/prisma.js";
import { verifySeller } from "./product.middleware.js";
import { validate } from "../../utils/validate.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../../schemas/product.schemas.js";

const router = Router();

router.get("/", getAllProductsController);
router.get("/:productId", getProductDetailsController);

router.use(authenticate, authorize([Role.ADMIN, Role.SELLER]));

router.post("/", validate(createProductSchema), createProductController);

router.patch(
  "/:productId/publish",
  verifySeller,
  publishProductController
);
router.patch(
  "/:productId/delist",
  verifySeller,
  delistProductController
);
router.patch(
  "/:productId/reactivate",
  verifySeller,
  reactivateProductController
);

router.patch(
  "/:productId/ban",
  authorize([Role.ADMIN]),
  banProductController
);
router.patch(
  "/:productId/lift-ban",
  authorize([Role.ADMIN]),
  liftBanProductController
);

router.put(
  "/:productId",
  verifySeller,
  validate(updateProductSchema),
  updateProductController
);
router.delete("/:productId", verifySeller, deleteProductController);

export default router;
