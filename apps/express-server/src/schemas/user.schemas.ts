import { z } from "zod";
import { Role } from "../types/prisma.js";

export const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  googleProfilePicture: z.string().url("Must be a valid URL.").optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
});

export const updateRoleSchema = z.object({
  role: z.enum([Role.BUYER, Role.SELLER]),
});
