import { z } from "zod";

export const recordPayoutSchema = z.object({
  amount: z.number().positive("Payout amount must be positive."),
  note: z.string().max(500).optional(),
});
