import { z } from "zod";

export const createEnquirySchema = z.object({
  name: z.string().min(1, "Name is required.").max(120),
  email: z.string().email("A valid email address is required.").max(254),
  phone: z
    .string()
    .max(30)
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters.")
    .max(5000),
});
