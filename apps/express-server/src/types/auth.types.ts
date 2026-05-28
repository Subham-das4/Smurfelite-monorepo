import * as PrismaNamespace from "./prisma.js";
import { Request } from "express";

export interface JwtPayload {
  id: string;
  email: string;
  role: PrismaNamespace.Role;
}

export type UserRegistrationInput = Omit<
  PrismaNamespace.User,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "googleId"
  | "lastLoginAt"
  | "products"
  | "orders"
  | "cart"
  | "enquiries"
  | "verificationToken"
  | "refreshToken"
  | "passwordResetToken"
  | "sellerWallet"
  | "disputesAsBuyer"
  | "disputesAsSeller"
  | "sellerDelisted"
  | "sellerApprovalStatus"
  | "sellerApprovedAt"
  | "sellerRejectedAt"
  | "sellerRejectionNote"
  | "adminInvitedAt"
  | "createdByAdminId"
  | "createdByAdmin"
  | "usersCreatedByAdmin"
>;

// Extend the Request interface to include user data
// This allows TypeScript to recognize req.user
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: PrismaNamespace.Role;
  };
}
