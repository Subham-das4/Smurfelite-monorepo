import { Router } from "express";
import { registerController, loginController, googleAuthController } from "./auth.controller.js";

const router = Router();

// POST /api/auth/register
router.post("/register", registerController);

// POST /api/auth/login
router.post("/login", loginController);

// POST /api/auth/google
router.post("/google", googleAuthController);

export default router;
