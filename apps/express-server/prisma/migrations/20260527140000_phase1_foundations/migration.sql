-- Phase 1 foundations: categories, disputes, wallets, payment status
-- Note: pgvector embedding column is in migrations/optional_pgvector_embedding.sql
--       (requires PostgreSQL with pgvector extension installed)

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_BUYER', 'RESOLVED_SELLER', 'CLOSED');
CREATE TYPE "WalletLedgerType" AS ENUM ('SALE_CREDIT', 'HOLD_RELEASED', 'PAYOUT', 'DISPUTE_FREEZE', 'DISPUTE_RELEASE', 'ADJUSTMENT');

-- AlterTable User
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- CreateTable GameCategory
CREATE TABLE "GameCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GameCategory_slug_key" ON "GameCategory"("slug");

-- AlterTable Product
ALTER TABLE "Product" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "gameCategoryId" TEXT;

ALTER TABLE "Product" ADD CONSTRAINT "Product_gameCategoryId_fkey" FOREIGN KEY ("gameCategoryId") REFERENCES "GameCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable Order
ALTER TABLE "Order" ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable Dispute
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable SellerWallet
CREATE TABLE "SellerWallet" (
    "userId" TEXT NOT NULL,
    "pendingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "frozenBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SellerWallet_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "SellerWallet" ADD CONSTRAINT "SellerWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable WalletLedger
CREATE TABLE "WalletLedger" (
    "id" TEXT NOT NULL,
    "walletUserId" TEXT NOT NULL,
    "type" "WalletLedgerType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "orderId" TEXT,
    "disputeId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletLedger_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_walletUserId_fkey" FOREIGN KEY ("walletUserId") REFERENCES "SellerWallet"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill GameCategory from distinct product gameType values
INSERT INTO "GameCategory" ("id", "name", "slug", "isRestricted", "createdAt")
SELECT
    gen_random_uuid()::text,
    gt,
    lower(regexp_replace(trim(gt), '\s+', '-', 'g')),
    false,
    CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "gameType" AS gt FROM "Product" WHERE trim("gameType") <> '') AS distinct_games
WHERE NOT EXISTS (
    SELECT 1 FROM "GameCategory" gc
    WHERE gc."slug" = lower(regexp_replace(trim(distinct_games.gt), '\s+', '-', 'g'))
);

UPDATE "Product" p
SET "gameCategoryId" = gc."id"
FROM "GameCategory" gc
WHERE gc."slug" = lower(regexp_replace(trim(p."gameType"), '\s+', '-', 'g'))
  AND p."gameCategoryId" IS NULL;
