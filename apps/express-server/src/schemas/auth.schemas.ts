import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().min(1, "Name is required."),
});

export const sellerApplySchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().min(1, "Name is required."),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, "Google credential token is required."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
});

/** Optional portal context when refreshing (e.g. seller switching to buyer storefront). */
export const refreshSchema = z.object({
  actingAs: z.enum(["BUYER", "SELLER"]).optional(),
});
