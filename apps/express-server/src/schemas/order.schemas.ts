import { z } from "zod";
import { OrderStatus } from "../types/prisma.js";

export const createOrderSchema = z.object({
  productIds: z
    .array(z.string().uuid("Each productId must be a valid UUID."))
    .min(1, "At least one product is required."),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(Object.values(OrderStatus) as [string, ...string[]]),
});

export const createPayPalOrderSchema = z.object({
  internalOrderId: z.string().uuid("internalOrderId must be a valid UUID."),
});

export const capturePayPalOrderSchema = z.object({
  paypalOrderId: z.string().min(1, "paypalOrderId is required."),
  internalOrderId: z.string().uuid("internalOrderId must be a valid UUID."),
});
