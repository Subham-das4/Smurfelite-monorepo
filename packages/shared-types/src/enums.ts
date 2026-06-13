/**
 * Browser-safe enum constants — keep in sync with Prisma schema enums
 * (packages/shared-types/src/generated/prisma after `prisma generate`).
 * Do not import Prisma CJS runtime in client bundles; use this module instead.
 */

export const Role = {
  ADMIN: "ADMIN",
  SELLER: "SELLER",
  BUYER: "BUYER",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const OrderStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const ProductStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  SOLD: "SOLD",
  DELISTED_BY_SELLER: "DELISTED_BY_SELLER",
  BANNED_BY_ADMIN: "BANNED_BY_ADMIN",
} as const;

export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const DisputeStatus = {
  OPEN: "OPEN",
  UNDER_REVIEW: "UNDER_REVIEW",
  RESOLVED_BUYER: "RESOLVED_BUYER",
  RESOLVED_SELLER: "RESOLVED_SELLER",
  CLOSED: "CLOSED",
} as const;

export type DisputeStatus = (typeof DisputeStatus)[keyof typeof DisputeStatus];

export const WalletLedgerType = {
  SALE_CREDIT: "SALE_CREDIT",
  HOLD_RELEASED: "HOLD_RELEASED",
  PAYOUT: "PAYOUT",
  DISPUTE_FREEZE: "DISPUTE_FREEZE",
  DISPUTE_RELEASE: "DISPUTE_RELEASE",
  ADJUSTMENT: "ADJUSTMENT",
} as const;

export type WalletLedgerType =
  (typeof WalletLedgerType)[keyof typeof WalletLedgerType];

export const SellerApprovalStatus = {
  NONE: "NONE",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type SellerApprovalStatus =
  (typeof SellerApprovalStatus)[keyof typeof SellerApprovalStatus];

export const PasswordResetPurpose = {
  BUYER: "BUYER",
  ADMIN: "ADMIN",
} as const;

export type PasswordResetPurpose =
  (typeof PasswordResetPurpose)[keyof typeof PasswordResetPurpose];
