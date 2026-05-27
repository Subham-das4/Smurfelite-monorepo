import { z } from "zod";

export const createDisputeSchema = z.object({
  orderId: z.string().uuid("A valid order ID is required."),
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters.")
    .max(500),
  details: z.record(z.string(), z.unknown()).optional(),
});
