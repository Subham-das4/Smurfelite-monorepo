import { z } from "zod";

export const createNowPaymentsInvoiceSchema = z.object({
  internalOrderId: z.string().uuid("internalOrderId must be a valid UUID."),
});

export const completeBypassPaymentSchema = createNowPaymentsInvoiceSchema;

export const createPayPalOrderSchema = z.object({
  internalOrderId: z.string().uuid("internalOrderId must be a valid UUID."),
});

export const capturePayPalOrderSchema = z.object({
  paypalOrderId: z.string().min(1, "paypalOrderId is required."),
  internalOrderId: z.string().uuid("internalOrderId must be a valid UUID."),
});
