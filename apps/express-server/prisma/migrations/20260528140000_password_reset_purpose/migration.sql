-- CreateEnum
CREATE TYPE "PasswordResetPurpose" AS ENUM ('BUYER', 'ADMIN');

-- AlterTable
ALTER TABLE "PasswordResetToken" ADD COLUMN "purpose" "PasswordResetPurpose" NOT NULL DEFAULT 'BUYER';
