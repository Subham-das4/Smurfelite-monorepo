import { z } from "zod";

export const createPlatformSchema = z.object({
  name: z.string().min(1, "name is required."),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase alphanumeric with hyphens.")
    .optional(),
});

export const updatePlatformSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
});

export const restrictPlatformSchema = z.object({
  isRestricted: z.boolean().optional(),
});
