import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { Role } from "../../types/prisma.js";
import { validate } from "../../utils/validate.js";
import {
  updateMeSchema,
  changePasswordSchema,
  updateRoleSchema,
} from "../../schemas/user.schemas.js";
import {
  getMeController,
  updateMeController,
  changePasswordController,
  getAllUsersController,
  updateUserRoleController,
  deleteUserController,
  delistSellerController,
  reactivateSellerController,
} from "./user.controller.js";

const router = Router();

router.use(authenticate);

// GET /api/users/me
router.get("/me", getMeController);

// PUT /api/users/me
router.put("/me", validate(updateMeSchema), updateMeController);

// PUT /api/users/me/password
router.put("/me/password", validate(changePasswordSchema), changePasswordController);

// ---- Admin routes ----

// GET /api/users — list all users (admin only)
router.get("/", authorize([Role.ADMIN]), getAllUsersController);

// PATCH /api/users/:userId/delist — admin delist seller + cascade products
router.patch(
  "/:userId/delist",
  authorize([Role.ADMIN]),
  delistSellerController
);

// PATCH /api/users/:userId/reactivate — admin restore seller listings
router.patch(
  "/:userId/reactivate",
  authorize([Role.ADMIN]),
  reactivateSellerController
);

// PATCH /api/users/:userId/role — change a user's role
router.patch(
  "/:userId/role",
  authorize([Role.ADMIN]),
  validate(updateRoleSchema),
  updateUserRoleController
);

// DELETE /api/users/:userId — delete a user
router.delete("/:userId", authorize([Role.ADMIN]), deleteUserController);

export default router;
