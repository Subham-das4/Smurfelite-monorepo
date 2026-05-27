import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { Role } from "../../types/prisma.js";
import { validate } from "../../utils/validate.js";
import {
  createGameCategorySchema,
  updateGameCategorySchema,
  restrictGameCategorySchema,
} from "../../schemas/game-category.schemas.js";
import {
  getAllGameCategoriesController,
  getGameCategoryController,
  createGameCategoryController,
  updateGameCategoryController,
  deleteGameCategoryController,
  restrictGameCategoryController,
} from "./game-category.controller.js";

const router = Router();

router.get("/", getAllGameCategoriesController);
router.get("/:categoryId", getGameCategoryController);

router.use(authenticate, authorize([Role.ADMIN]));

router.post("/", validate(createGameCategorySchema), createGameCategoryController);
router.patch(
  "/:categoryId",
  validate(updateGameCategorySchema),
  updateGameCategoryController
);
router.patch(
  "/:categoryId/restrict",
  validate(restrictGameCategorySchema),
  restrictGameCategoryController
);
router.delete("/:categoryId", deleteGameCategoryController);

export default router;
