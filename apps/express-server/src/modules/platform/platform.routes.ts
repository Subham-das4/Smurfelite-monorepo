import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { Role } from "../../types/prisma.js";
import { validate } from "../../utils/validate.js";
import {
  createPlatformSchema,
  updatePlatformSchema,
  restrictPlatformSchema,
} from "../../schemas/platform.schemas.js";
import {
  getAllPlatformsController,
  getPlatformController,
  createPlatformController,
  updatePlatformController,
  deletePlatformController,
  restrictPlatformController,
} from "./platform.controller.js";

const router = Router();

router.get("/", getAllPlatformsController);
router.get("/:platformId", getPlatformController);

router.use(authenticate, authorize([Role.ADMIN]));

router.post("/", validate(createPlatformSchema), createPlatformController);
router.patch(
  "/:platformId",
  validate(updatePlatformSchema),
  updatePlatformController
);
router.patch(
  "/:platformId/restrict",
  validate(restrictPlatformSchema),
  restrictPlatformController
);
router.delete("/:platformId", deletePlatformController);

export default router;
