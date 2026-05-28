import * as PrismaNamespace from "../../types/prisma.js";
import prisma from "../../lib/prisma.js";
import ApiError from "../../utils/errors.js";
import bcrypt from "bcrypt";
import { RefreshTokenPayload, UserRegistrationInput } from "../../types/auth.types.js";
import {
  buildAccessTokenPayload,
  buildRefreshTokenPayload,
  defaultActingAsForRole,
} from "./auth.token.js";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import logger from "../../utils/logger.js";
import { createCart } from "../cart/cart.service.js";
import {
  sendAdminPasswordResetEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../../services/email/transactional.service.js";
import { AuthErrorMessages, PASSWORD_RESET_GENERIC_MESSAGE } from "./auth.message.js";

const JWT_SECRET = process.env.JWT_SECRET!;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS!);
const TOKEN_EXPIRATION = process.env
  .TOKEN_EXPIRATION! as SignOptions["expiresIn"];

if (!JWT_SECRET || !SALT_ROUNDS || isNaN(SALT_ROUNDS) || !TOKEN_EXPIRATION) {
  throw new Error("Missing or invalid authentication environment variables.");
}

export function generateTokens(
  userId: string,
  userRole: string,
  actingAs?: PrismaNamespace.Role
) {
  const role = userRole as PrismaNamespace.Role;
  const effectiveActingAs =
    actingAs ?? defaultActingAsForRole(role);

  const accessPayload = buildAccessTokenPayload(
    userId,
    role,
    effectiveActingAs
  );
  const accessToken = jwt.sign(accessPayload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRATION,
  } as jwt.SignOptions);

  const refreshPayload = buildRefreshTokenPayload(
    userId,
    role,
    effectiveActingAs
  );
  const refreshToken = jwt.sign(refreshPayload, JWT_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || "7d",
  } as jwt.SignOptions);

  return { accessToken, refreshToken, actingAs: accessPayload.actingAs };
}

export const registerUser = async (
  userRegistrationInput: UserRegistrationInput
): Promise<Omit<PrismaNamespace.User, "password">> => {
  const { email, password, name } = userRegistrationInput;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === PrismaNamespace.Role.ADMIN) {
      throw new ApiError(AuthErrorMessages.ADMIN_EMAIL_RESERVED, 409);
    }
    throw new ApiError(AuthErrorMessages.USER_ALREADY_EXISTS, 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: PrismaNamespace.Role.BUYER,
    },
  });

  await generateAndSaveVerificationToken(user.id, user.email, user.name);

  // Remove password before returning
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

async function authenticateCredentials(
  email: string,
  password: string
): Promise<PrismaNamespace.User> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(AuthErrorMessages.INVALID_CREDENTIALS, 401);
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new ApiError(AuthErrorMessages.INVALID_CREDENTIALS, 401);
  }

  return user;
}

async function touchLastLogin(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

function stripPassword(
  user: PrismaNamespace.User
): Omit<PrismaNamespace.User, "password"> {
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export const loginUser = async (
  email: string,
  password: string
): Promise<Omit<PrismaNamespace.User, "password">> => {
  const user = await authenticateCredentials(email, password);
  const updatedUser = await touchLastLogin(user.id);
  return stripPassword(updatedUser);
};

export async function loginBuyerPortal(
  email: string,
  password: string
): Promise<Omit<PrismaNamespace.User, "password">> {
  const user = await authenticateCredentials(email, password);
  if (user.role === PrismaNamespace.Role.ADMIN) {
    throw new ApiError(AuthErrorMessages.WRONG_BUYER_PORTAL, 403);
  }
  const updatedUser = await touchLastLogin(user.id);
  return stripPassword(updatedUser);
}

export async function loginSellerPortal(
  email: string,
  password: string
): Promise<Omit<PrismaNamespace.User, "password">> {
  const user = await authenticateCredentials(email, password);
  if (user.role !== PrismaNamespace.Role.SELLER) {
    throw new ApiError(AuthErrorMessages.WRONG_SELLER_PORTAL, 403);
  }
  const updatedUser = await touchLastLogin(user.id);
  return stripPassword(updatedUser);
}

export async function loginAdminPortal(
  email: string,
  password: string
): Promise<Omit<PrismaNamespace.User, "password">> {
  const user = await authenticateCredentials(email, password);
  if (user.role !== PrismaNamespace.Role.ADMIN) {
    throw new ApiError(AuthErrorMessages.WRONG_ADMIN_PORTAL, 403);
  }
  const updatedUser = await touchLastLogin(user.id);
  return stripPassword(updatedUser);
};

async function generateAndSaveVerificationToken(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  await prisma.verificationToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  try {
    await sendVerificationEmail({ to: email, name, token });
    logger.info(`Verification email sent to ${email}`);
  } catch (err) {
    logger.error(`Failed to send verification email to ${email}:`, err);
  }

  return token;
}

export async function saveRefreshToken(userId: string, token: string) {
  const expirationDate = new Date();
  // Decode JWT to get expiration timestamp (exp)
  const decodedToken = jwt.decode(token) as jwt.JwtPayload;

  if (decodedToken && decodedToken.exp) {
    expirationDate.setTime(decodedToken.exp * 1000);
  } else {
    // Fallback if decoding fails (7 days default)
    expirationDate.setDate(expirationDate.getDate() + 7);
  }

  await prisma.refreshToken.upsert({
    where: { token },
    create: {
      userId,
      token,
      expiresAt: expirationDate,
    },
    update: {
      expiresAt: expirationDate,
    },
  });
}

export async function refreshTokens(
  refreshToken: string,
  options?: { actingAs?: PrismaNamespace.Role }
) {
  // 1. Verify refresh token signature
  const payload = jwt.verify(refreshToken, JWT_SECRET) as RefreshTokenPayload;
  const userId = payload.id;

  // 2. Check if the token exists and is valid in the database
  const dbToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!dbToken || dbToken.expiresAt < new Date()) {
    throw new ApiError(AuthErrorMessages.INVALID_OR_EXPIRED_REFRESH_TOKEN, 401);
  }

  // 3. Revoke the old refresh token (one-time use)
  await prisma.refreshToken.delete({ where: { token: refreshToken } });

  // 4. Find user to get role for the new access token
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found.");
  }

  const actingAs = options?.actingAs ?? payload.actingAs;

  // 5. Generate NEW tokens (preserve or override portal context)
  const { accessToken: newAccessToken, refreshToken: newRefreshToken, actingAs: issuedActingAs } =
    generateTokens(userId, user.role, actingAs);

  // 6. Save the NEW refresh token
  await saveRefreshToken(userId, newRefreshToken);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    actingAs: issuedActingAs,
  };
}

export async function verifyEmail(
  token: string
): Promise<PrismaNamespace.User> {
  const verificationRecord = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verificationRecord) {
    throw new ApiError(AuthErrorMessages.INVALID_VERIFICATION_TOKEN, 400);
  }

  // 2. Check token expiration
  if (verificationRecord.expiresAt < new Date()) {
    // Delete the expired token to clean up
    await prisma.verificationToken.delete({ where: { token } });
    throw new ApiError(AuthErrorMessages.INVALID_VERIFICATION_TOKEN, 400);
  }

  // 3. Mark the user as verified
  const updatedUser = await prisma.user.update({
    where: { id: verificationRecord.userId },
    data: { isVerified: true },
  });
  await createCart(updatedUser.id);

  // 4. Delete the token (it's one-time use)
  await prisma.verificationToken.delete({ where: { token } });

  logger.info(`User ${updatedUser.email} has been verified.`);
  return updatedUser;
}

export async function logoutUser(refreshToken: string): Promise<void> {
  if (!refreshToken) return;
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}

export async function forgotPasswordBuyer(email: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role === PrismaNamespace.Role.ADMIN) {
    return PASSWORD_RESET_GENERIC_MESSAGE;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.upsert({
    where: { userId: user.id },
    update: { token, expiresAt, purpose: PrismaNamespace.PasswordResetPurpose.BUYER },
    create: {
      token,
      userId: user.id,
      expiresAt,
      purpose: PrismaNamespace.PasswordResetPurpose.BUYER,
    },
  });

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token,
    });
    logger.info(`Buyer password reset email sent to ${email}`);
  } catch (err) {
    logger.error(`Failed to send buyer password reset email to ${email}:`, err);
  }

  return PASSWORD_RESET_GENERIC_MESSAGE;
}

export async function resetPasswordBuyer(
  token: string,
  newPassword: string
): Promise<void> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: { select: { role: true } } },
  });

  if (
    !record ||
    record.expiresAt < new Date() ||
    record.purpose !== PrismaNamespace.PasswordResetPurpose.BUYER ||
    record.user.role === PrismaNamespace.Role.ADMIN
  ) {
    throw new ApiError(AuthErrorMessages.INVALID_PASSWORD_RESET_TOKEN, 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.delete({ where: { token } }),
  ]);
}

export async function forgotPasswordAdmin(email: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== PrismaNamespace.Role.ADMIN) {
    return PASSWORD_RESET_GENERIC_MESSAGE;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.upsert({
    where: { userId: user.id },
    update: { token, expiresAt, purpose: PrismaNamespace.PasswordResetPurpose.ADMIN },
    create: {
      token,
      userId: user.id,
      expiresAt,
      purpose: PrismaNamespace.PasswordResetPurpose.ADMIN,
    },
  });

  try {
    await sendAdminPasswordResetEmail({
      to: user.email,
      name: user.name,
      token,
    });
    logger.info(`Admin password reset email sent to ${email}`);
  } catch (err) {
    logger.error(`Failed to send admin password reset email to ${email}:`, err);
  }

  return PASSWORD_RESET_GENERIC_MESSAGE;
}

export async function resetPasswordAdmin(
  token: string,
  newPassword: string
): Promise<void> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: { select: { role: true } } },
  });

  if (
    !record ||
    record.expiresAt < new Date() ||
    record.purpose !== PrismaNamespace.PasswordResetPurpose.ADMIN ||
    record.user.role !== PrismaNamespace.Role.ADMIN
  ) {
    throw new ApiError(AuthErrorMessages.INVALID_PASSWORD_RESET_TOKEN, 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.delete({ where: { token } }),
  ]);
}

/** @deprecated Use forgotPasswordBuyer — legacy /auth/forgot-password */
export async function forgotPassword(email: string): Promise<string> {
  return forgotPasswordBuyer(email);
}

/** @deprecated Use resetPasswordBuyer — legacy /auth/reset-password */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  return resetPasswordBuyer(token, newPassword);
}

export async function verifyGoogleOAuth(credential: string): Promise<PrismaNamespace.User> {
  const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${credential}` },
  });

  if (!userInfoResponse.ok) {
    throw new ApiError(AuthErrorMessages.INVALID_GOOGLE_PROFILE, 401);
  }

  const payload = await userInfoResponse.json() as {
    sub: string;
    email: string;
    name?: string;
    picture?: string;
  };

  const googleId = payload.sub;
  const email = payload.email;
  const name = payload.name ?? '';
  const profilePicture = payload.picture ?? '';

  if (!email) {
    throw new ApiError(AuthErrorMessages.INVALID_GOOGLE_PROFILE, 400);
  }

  // 1. Find or Create the user (UPSERT logic)
  let user = await prisma.user.findUnique({ where: { googleId } });

  if (!user) {
    // Check for existing user by email (local account linking)
    user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // User exists via local login, link the Google ID
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleId },
      });
      // Ensure the linked account has a cart (may be missing for accounts created before cart feature)
      const existingCart = await prisma.cart.findUnique({ where: { userId: user.id } });
      if (!existingCart) await createCart(user.id);
      logger.info(
        `Linked Google account for existing user: ${user.email}`
      );
    } else {
      // New user, create the account
      user = await prisma.user.create({
        data: {
          googleId: googleId,
          email: email,
          name: name,
          isVerified: true, // Auto-verify email from Google
          role: PrismaNamespace.Role.BUYER,
          password: "", // No password for OAuth users
          googleProfilePicture: profilePicture,
        },
      });
      await createCart(user.id);
      logger.info(`New user created via Google OAuth: ${user.email}`);
    }

  }

  user = await prisma.user.update({
    where: { id: user!.id },
    data: {
      name: name,
      googleProfilePicture: profilePicture,
      lastLoginAt: new Date(),
    },
  });
  logger.info(`Google OAuth login for user: ${user.email}`);

  return user;
}

export type GoogleOAuthPortal = "buyer" | "seller";

/** Google sign-in with portal-specific role gate (new users always register as BUYER). */
export async function verifyGoogleOAuthForPortal(
  credential: string,
  portal: GoogleOAuthPortal
): Promise<PrismaNamespace.User> {
  const user = await verifyGoogleOAuth(credential);

  if (portal === "buyer") {
    if (user.role === PrismaNamespace.Role.ADMIN) {
      throw new ApiError(AuthErrorMessages.WRONG_BUYER_PORTAL, 403);
    }
    return user;
  }

  if (user.role !== PrismaNamespace.Role.SELLER) {
    throw new ApiError(AuthErrorMessages.WRONG_SELLER_PORTAL, 403);
  }

  return user;
}