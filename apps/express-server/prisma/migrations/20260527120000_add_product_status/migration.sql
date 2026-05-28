-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PENDING_VERIFICATION', 'SOLD', 'DELISTED_BY_SELLER', 'BANNED_BY_ADMIN');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "sellerDelisted" BOOLEAN NOT NULL DEFAULT false;

-- Backfill existing listings: available -> ACTIVE, unavailable -> SOLD
UPDATE "Product" SET "status" = 'ACTIVE' WHERE "isAvailable" = true;
UPDATE "Product" SET "status" = 'SOLD' WHERE "isAvailable" = false;
