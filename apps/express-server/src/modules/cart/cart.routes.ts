import { Router } from "express";
import { getCartController, addToCartController, removeFromCartController, clearCartController } from "./cart.controller.js";
import { authenticate, authorizeBuyerPortal } from "../auth/auth.middleware.js";

const router = Router();

router.use(authenticate, authorizeBuyerPortal());

router.get("/", getCartController);

router.delete("/", clearCartController);

router.post("/:productId", addToCartController);

router.delete("/:productId", removeFromCartController);

export default router;