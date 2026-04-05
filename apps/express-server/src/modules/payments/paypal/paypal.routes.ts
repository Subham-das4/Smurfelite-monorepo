import { Router } from "express";
import { paypalwebhookController } from "./paypal.controller.js";

const router = Router();

router.post("/paypal", paypalwebhookController)

export default router;