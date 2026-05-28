import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { Role } from "../../types/prisma.js";
import { validate } from "../../utils/validate.js";
import { createAdminSchema } from "./admin.schemas.js";
import {
  createAdminController,
  listAdminsController,
  deleteAdminController,
} from "./admin.controller.js";

const router = Router();

router.use(authenticate, authorize([Role.ADMIN]));

router.get("/", listAdminsController);
router.post("/", validate(createAdminSchema), createAdminController);
router.delete("/:adminId", deleteAdminController);

export default router;
