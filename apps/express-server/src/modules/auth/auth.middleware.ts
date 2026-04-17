import * as PrismaNamespace from "../../types/prisma.js";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../../utils/logger.js";
import { AuthenticatedRequest, JwtPayload } from "../../types/auth.types.js";

/**
 * Middleware to verify the JWT Access Token and authenticate the user.
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authReq = req as AuthenticatedRequest;
  // 1. Check for Authorization header
  const authHeader = authReq.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn(
      "Authentication failed: Missing or invalid Authorization header."
    );
    return res
      .status(401)
      .json({ message: "Access Denied. No token provided." });
  }

  // 2. Extract the token
  const token = authHeader.split(" ")[1];

  try {
    // 3. Verify the token using the secret
    const payload: JwtPayload = jwt.verify(
      token,
      process.env.JWT_SECRET!,
      // { algorithms: ['RS256'] }
    ) as JwtPayload;

    // Check if required data exists in payload
    if (!payload.id || !payload.role) {
      console.log(payload)
      throw new Error("Invalid token payload.");
    }

    // 4. Attach user information to the request object
    authReq.user = {
      id: payload.id,
      role: payload.role as PrismaNamespace.Role,
    };

    // 5. Proceed to the next middleware or controller
    next();
  } catch (error: any) {
    logger.warn(`Authentication failed: ${error.message}`);

    // Generic unauthorized response
    return res.status(401).json({ message: "Unauthorized access." });
  }
};

export const authorize = (roles: PrismaNamespace.Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    // Check if user object was attached by the authenticate middleware
    if (!authReq.user || !authReq.user.role) {
      // This should ideally not happen if 'authenticate' runs first
      logger.error("Authorization failed: User object missing from request.");
      return res
        .status(403)
        .json({ message: "Forbidden: Missing authentication context." });
    }

    // Check if the user's role is included in the allowed roles list
    if (!roles.includes(authReq.user.role)) {
      logger.warn(
        `Authorization failed for user ${authReq.user.id}: Role ${authReq.user.role} not permitted.`
      );
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions." });
    }

    // Role is permitted, continue
    next();
  };
};
