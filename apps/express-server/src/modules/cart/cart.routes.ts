import { Router } from "express";
import { getCartController, addToCartController, removeFromCartController } from "./cart.controller.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import { Role } from "@smurfelite/types";

const router = Router();

router.use(authenticate, authorize([Role.BUYER]));

router.get("/", getCartController);

router.post("/:productId", addToCartController);

router.delete("/:productId", removeFromCartController);

export default router;