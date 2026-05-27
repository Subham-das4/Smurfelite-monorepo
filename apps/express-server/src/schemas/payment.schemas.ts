import { z } from "zod";

export const createNowPaymentsInvoiceSchema = z.object({
  internalOrderId: z.string().uuid("internalOrderId must be a valid UUID."),
});
