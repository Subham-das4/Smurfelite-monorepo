import { z } from "zod";
import { SellerApprovalStatus } from "../../types/prisma.js";

export const createSellerSchema = z.object({
  email: z.string().email("A valid email is required."),
  name: z.string().min(1, "Name is required."),
});

export const listSellersQuerySchema = z.object({
  status: z
    .enum([
      SellerApprovalStatus.PENDING,
      SellerApprovalStatus.APPROVED,
      SellerApprovalStatus.REJECTED,
    ])
    .optional()
    .default(SellerApprovalStatus.PENDING),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const rejectSellerSchema = z.object({
  note: z.string().optional(),
});
