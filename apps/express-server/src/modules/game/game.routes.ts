import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { Role } from "../../types/prisma.js";
import { validate } from "../../utils/validate.js";
import {
  createGameSchema,
  updateGameSchema,
  restrictGameSchema,
} from "../../schemas/game.schemas.js";
import {
  getAllGamesController,
  getGameController,
  createGameController,
  updateGameController,
  deleteGameController,
  restrictGameController,
} from "./game.controller.js";

const router = Router();

router.get("/", getAllGamesController);
router.get("/:gameId", getGameController);

router.use(authenticate, authorize([Role.ADMIN]));

router.post("/", validate(createGameSchema), createGameController);
router.patch("/:gameId", validate(updateGameSchema), updateGameController);
router.patch(
  "/:gameId/restrict",
  validate(restrictGameSchema),
  restrictGameController
);
router.delete("/:gameId", deleteGameController);

export default router;
