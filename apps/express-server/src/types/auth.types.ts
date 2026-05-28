import * as PrismaNamespace from "./prisma.js";
import { Request } from "express";

/** Access JWT claims (Bearer token). */
export interface AccessTokenPayload {
  id: string;
  role: PrismaNamespace.Role;
  /** Portal context: BUYER (storefront) or SELLER (seller portal). Omitted for ADMIN. */
  actingAs?: PrismaNamespace.Role;
  email?: string;
}

/** Refresh JWT claims (HTTP-only cookie). */
export interface RefreshTokenPayload {
  id: string;
  jti: string;
  actingAs?: PrismaNamespace.Role;
}

/** @deprecated Use AccessTokenPayload — kept for loginUser legacy path. */
export interface JwtPayload extends AccessTokenPayload {
  email: string;
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

export interface AuthenticatedUser {
  id: string;
  role: PrismaNamespace.Role;
  actingAs?: PrismaNamespace.Role;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
