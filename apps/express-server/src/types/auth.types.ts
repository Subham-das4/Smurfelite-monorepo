import * as PrismaNamespace from "@smurfelite/types/src/generated/prisma/index.js";
import { Request } from "express";

export interface JwtPayload {
  id: string;
  email: string;
  role: PrismaNamespace.Role;
}

export type UserRegistrationInput = Omit<
  PrismaNamespace.User,
  "id" | "createdAt" | "updatedAt" | "googleId"
>;

// Extend the Request interface to include user data
// This allows TypeScript to recognize req.user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: PrismaNamespace.Role;
  };
}
