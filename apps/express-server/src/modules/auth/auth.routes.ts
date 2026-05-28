import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  registerController,
  loginController,
  buyerLoginController,
  sellerLoginController,
  adminLoginController,
  googleAuthController,
  buyerGoogleAuthController,
  sellerGoogleAuthController,
  refreshController,
  verifyEmailController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
  buyerForgotPasswordController,
  buyerResetPasswordController,
  adminForgotPasswordController,
  adminResetPasswordController,
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
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 20 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// POST /api/auth/register
router.post("/register", authLimiter, validate(registerSchema), registerController);

// Portal-specific login (Phase 10.3)
router.post("/buyer/login", authLimiter, validate(loginSchema), buyerLoginController);
router.post("/seller/login", authLimiter, validate(loginSchema), sellerLoginController);
router.post("/admin/login", authLimiter, validate(loginSchema), adminLoginController);

// Legacy login — deprecated
router.post("/login", authLimiter, validate(loginSchema), loginController);

// Portal-specific Google OAuth
router.post("/buyer/google", authLimiter, validate(googleAuthSchema), buyerGoogleAuthController);
router.post("/seller/google", authLimiter, validate(googleAuthSchema), sellerGoogleAuthController);

// Legacy Google — deprecated (delegates to buyer)
router.post("/google", authLimiter, validate(googleAuthSchema), googleAuthController);

router.post("/refresh", validate(refreshSchema), refreshController);

router.get("/verify-email", verifyEmailController);

router.post("/logout", logoutController);

// Buyer password reset (storefront)
router.post(
  "/buyer/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  buyerForgotPasswordController
);
router.post(
  "/buyer/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  buyerResetPasswordController
);

// Admin password reset (admin panel)
router.post(
  "/admin/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  adminForgotPasswordController
);
router.post(
  "/admin/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  adminResetPasswordController
);

// Legacy password reset — deprecated
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPasswordController
);
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  resetPasswordController
);

export default router;
