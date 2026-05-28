-- CreateEnum
CREATE TYPE "SellerApprovalStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "sellerApprovalStatus" "SellerApprovalStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN "sellerApprovedAt" TIMESTAMP(3),
ADD COLUMN "sellerRejectedAt" TIMESTAMP(3),
ADD COLUMN "sellerRejectionNote" TEXT,
ADD COLUMN "adminInvitedAt" TIMESTAMP(3),
ADD COLUMN "createdByAdminId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: existing sellers remain storefront-visible until Phase 10.5 gates apply
UPDATE "User" SET "sellerApprovalStatus" = 'APPROVED', "sellerApprovedAt" = NOW() WHERE "role" = 'SELLER' AND "sellerApprovalStatus" = 'NONE';
