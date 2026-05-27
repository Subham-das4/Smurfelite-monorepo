import { Router } from "express";
import { emailStatusController } from "./email.controller.js";

const router = Router();

router.get("/status", emailStatusController);

export default router;
