import { Router } from "express";
import { getCartController, addToCartController, removeFromCartController, clearCartController } from "./cart.controller.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { Role } from "../../types/prisma.js";

const router = Router();

router.use(authenticate, authorize([Role.BUYER]));

router.get("/", getCartController);

router.delete("/", clearCartController);

router.post("/:productId", addToCartController);

router.delete("/:productId", removeFromCartController);

export default router;