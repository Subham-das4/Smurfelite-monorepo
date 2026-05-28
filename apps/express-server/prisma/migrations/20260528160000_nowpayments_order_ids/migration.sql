-- AlterTable
ALTER TABLE "Order" ADD COLUMN "paymentProvider" TEXT,
ADD COLUMN "nowpaymentsInvoiceId" TEXT,
ADD COLUMN "nowpaymentsPaymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_nowpaymentsInvoiceId_key" ON "Order"("nowpaymentsInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_nowpaymentsPaymentId_key" ON "Order"("nowpaymentsPaymentId");

-- Backfill payment id from legacy paymentIntent where applicable
UPDATE "Order"
SET "nowpaymentsPaymentId" = "paymentIntent"
WHERE "paymentProvider" = 'nowpayments'
  AND "paymentIntent" IS NOT NULL
  AND "nowpaymentsPaymentId" IS NULL;
