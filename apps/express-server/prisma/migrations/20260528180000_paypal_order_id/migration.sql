-- AlterTable
ALTER TABLE "Order" ADD COLUMN "paypalOrderId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_paypalOrderId_key" ON "Order"("paypalOrderId");

-- Backfill from legacy paymentIntent where applicable
UPDATE "Order"
SET "paypalOrderId" = "paymentIntent"
WHERE "paymentProvider" = 'paypal'
  AND "paymentIntent" IS NOT NULL
  AND "paypalOrderId" IS NULL;
