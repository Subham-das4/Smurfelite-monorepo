import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * On failure, returns 400 with a list of field errors.
 */
export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues ?? [];
      const errors = issues.map((e) => ({
        field: e.path.map(String).join("."),
        message: e.message,
      }));
      return res.status(400).json({ message: "Validation failed.", errors });
    }
    req.body = result.data;
    next();
  };
