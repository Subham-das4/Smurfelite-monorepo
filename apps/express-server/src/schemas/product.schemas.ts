import { z } from "zod";

const productStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "PENDING_VERIFICATION",
  "SOLD",
  "DELISTED_BY_SELLER",
  "BANNED_BY_ADMIN",
]);

export const createProductSchema = z.object({
  gameType: z.string().min(1, "gameType is required."),
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
  price: z.number().positive("Price must be a positive number."),
  specifications: z.record(z.string(), z.unknown()).default({}),
  sellerId: z.string().uuid("sellerId must be a valid UUID."),
  imageUrl: z.string().url("Must be a valid URL.").optional(),
  accountUsername: z.string().min(1, "accountUsername is required."),
  accountPassword: z.string().min(1, "accountPassword is required."),
  accountEmail: z.string().min(1, "accountEmail is required."),
  accountEmailPassword: z.string().min(1, "accountEmailPassword is required."),
});

export const updateProductSchema = z.object({
  gameType: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  specifications: z.record(z.string(), z.unknown()).optional(),
  imageUrl: z.string().url().optional(),
  status: productStatusSchema.optional(),
  sellerDelisted: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  accountUsername: z.string().min(1).optional(),
  accountPassword: z.string().min(1).optional(),
  accountEmail: z.string().min(1).optional(),
  accountEmailPassword: z.string().min(1).optional(),
});
