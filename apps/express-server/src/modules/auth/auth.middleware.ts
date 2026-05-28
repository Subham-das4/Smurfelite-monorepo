import * as PrismaNamespace from "../../types/prisma.js";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../../utils/logger.js";
import {
  AuthenticatedRequest,
  AccessTokenPayload,
} from "../../types/auth.types.js";
import { resolveEffectiveActingAs } from "./auth.token.js";

export type AuthorizeOptions = {
  /** Require this portal context on the access token (ADMIN bypasses). */
  actingAs?: PrismaNamespace.Role;
};

function attachUserFromPayload(
  authReq: AuthenticatedRequest,
  payload: AccessTokenPayload
) {
  authReq.user = {
    id: payload.id,
    role: payload.role as PrismaNamespace.Role,
    actingAs: payload.actingAs as PrismaNamespace.Role | undefined,
  };
}

/**
 * Middleware to verify the JWT Access Token and authenticate the user.
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authReq = req as AuthenticatedRequest;
  const authHeader = authReq.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn(
      "Authentication failed: Missing or invalid Authorization header."
    );
    return res
      .status(401)
      .json({ message: "Access Denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as AccessTokenPayload;

    if (!payload.id || !payload.role) {
      throw new Error("Invalid token payload.");
    }

    attachUserFromPayload(authReq, payload);
    next();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.warn(`Authentication failed: ${message}`);
    return res.status(401).json({ message: "Unauthorized access." });
  }
};

export const authorize = (
  roles: PrismaNamespace.Role[],
  options?: AuthorizeOptions
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.role) {
      logger.error("Authorization failed: User object missing from request.");
      return res
        .status(403)
        .json({ message: "Forbidden: Missing authentication context." });
    }

    const { role, actingAs } = authReq.user;

    if (!roles.includes(role)) {
      logger.warn(
        `Authorization failed for user ${authReq.user.id}: Role ${role} not permitted.`
      );
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions." });
    }

    if (role === PrismaNamespace.Role.ADMIN) {
      return next();
    }

    const requiredActingAs = options?.actingAs;
    if (requiredActingAs) {
      const effective = resolveEffectiveActingAs(role, actingAs);
      if (effective !== requiredActingAs) {
        logger.warn(
          `Authorization failed for user ${authReq.user.id}: actingAs ${effective ?? "none"} !== ${requiredActingAs}.`
        );
        return res
          .status(403)
          .json({ message: "Forbidden: Invalid portal context for this route." });
      }
    }

    next();
  };
};

/** Buyer storefront routes (BUYER or SELLER shopping as buyer). */
export const authorizeBuyerPortal = () =>
  authorize([PrismaNamespace.Role.BUYER, PrismaNamespace.Role.SELLER], {
    actingAs: PrismaNamespace.Role.BUYER,
  });

/** Seller portal routes. */
export const authorizeSellerPortal = () =>
  authorize([PrismaNamespace.Role.SELLER], {
    actingAs: PrismaNamespace.Role.SELLER,
  });

/**
 * Attaches user context when a valid Bearer token is present.
 * Does not reject requests without a token (guest access).
 */
export const optionalAuthenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authReq = req as AuthenticatedRequest;
  const authHeader = authReq.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as AccessTokenPayload;

    if (!payload.id || !payload.role) {
      return next();
    }

    attachUserFromPayload(authReq, payload);
  } catch {
    // Invalid token on a public route — proceed as guest
  }

  next();
};
