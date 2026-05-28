import crypto from "crypto";
import * as PrismaNamespace from "../../types/prisma.js";
import ApiError from "../../utils/errors.js";
import { AuthErrorMessages } from "./auth.message.js";
import type { AccessTokenPayload, RefreshTokenPayload } from "../../types/auth.types.js";

/** Default portal context for legacy tokens and shared /auth/login. */
export function defaultActingAsForRole(
  role: PrismaNamespace.Role
): PrismaNamespace.Role | undefined {
  if (role === PrismaNamespace.Role.BUYER) return PrismaNamespace.Role.BUYER;
  if (role === PrismaNamespace.Role.SELLER) return PrismaNamespace.Role.SELLER;
  return undefined;
}

export function resolveEffectiveActingAs(
  role: PrismaNamespace.Role,
  actingAs?: PrismaNamespace.Role
): PrismaNamespace.Role | undefined {
  if (role === PrismaNamespace.Role.ADMIN) return undefined;
  return actingAs ?? defaultActingAsForRole(role);
}

/** Validates portal context for token issuance and refresh. */
export function normalizeActingAsForRole(
  dbRole: PrismaNamespace.Role,
  requestedActingAs?: PrismaNamespace.Role
): PrismaNamespace.Role | undefined {
  if (dbRole === PrismaNamespace.Role.ADMIN) {
    if (requestedActingAs) {
      throw new ApiError(AuthErrorMessages.INVALID_PORTAL_CONTEXT, 403);
    }
    return undefined;
  }

  const actingAs = requestedActingAs ?? defaultActingAsForRole(dbRole);
  if (!actingAs) {
    throw new ApiError(AuthErrorMessages.INVALID_PORTAL_CONTEXT, 403);
  }

  if (dbRole === PrismaNamespace.Role.BUYER && actingAs !== PrismaNamespace.Role.BUYER) {
    throw new ApiError(AuthErrorMessages.INVALID_PORTAL_CONTEXT, 403);
  }

  if (
    dbRole === PrismaNamespace.Role.SELLER &&
    actingAs !== PrismaNamespace.Role.BUYER &&
    actingAs !== PrismaNamespace.Role.SELLER
  ) {
    throw new ApiError(AuthErrorMessages.INVALID_PORTAL_CONTEXT, 403);
  }

  return actingAs;
}

export function buildAccessTokenPayload(
  userId: string,
  role: PrismaNamespace.Role,
  actingAs?: PrismaNamespace.Role
): AccessTokenPayload {
  const effectiveActingAs = normalizeActingAsForRole(role, actingAs);
  const payload: AccessTokenPayload = {
    id: userId,
    role,
  };
  if (effectiveActingAs) {
    payload.actingAs = effectiveActingAs;
  }
  return payload;
}

export function buildRefreshTokenPayload(
  userId: string,
  role: PrismaNamespace.Role,
  actingAs?: PrismaNamespace.Role
): RefreshTokenPayload {
  const effectiveActingAs = normalizeActingAsForRole(role, actingAs);
  const payload: RefreshTokenPayload = {
    id: userId,
    jti: crypto.randomUUID(),
  };
  if (effectiveActingAs) {
    payload.actingAs = effectiveActingAs;
  }
  return payload;
}
