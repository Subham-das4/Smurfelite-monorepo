import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  registerController,
  loginController,
  googleAuthController,
  refreshController,
  verifyEmailController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
} from "./auth.controller.js";
import { validate } from "../../utils/validate.js";
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema,
} from "../../schemas/auth.schemas.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 20 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// POST /api/auth/register
router.post("/register", authLimiter, validate(registerSchema), registerController);

// POST /api/auth/login
router.post("/login", authLimiter, validate(loginSchema), loginController);

// POST /api/auth/google
router.post("/google", authLimiter, validate(googleAuthSchema), googleAuthController);

// POST /api/auth/refresh — rotate refresh token
router.post("/refresh", validate(refreshSchema), refreshController);

// GET /api/auth/verify-email?token=...
router.get("/verify-email", verifyEmailController);

// POST /api/auth/logout
router.post("/logout", logoutController);

// POST /api/auth/forgot-password
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), forgotPasswordController);

// POST /api/auth/reset-password
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), resetPasswordController);

export default router;
