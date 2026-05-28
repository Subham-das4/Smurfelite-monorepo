import crypto from "crypto";
import bcrypt from "bcrypt";
import { Role } from "../../types/prisma.js";
import { prisma } from "../../lib/prisma.js";
import ApiError from "../../utils/errors.js";
import logger from "../../utils/logger.js";
import { sendAdminInviteEmail } from "../../services/email/transactional.service.js";
import { AdminErrorMessages } from "./admin.messages.js";

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS!) || 10;

const adminSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  lastLoginAt: true,
  createdAt: true,
  adminInvitedAt: true,
  createdByAdminId: true,
} as const;

export function generateInvitePassword(): string {
  return crypto.randomBytes(12).toString("base64url");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createAdmin(
  createdByAdminId: string,
  input: { email: string; name: string }
) {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === Role.ADMIN) {
      throw new ApiError(AdminErrorMessages.EMAIL_ALREADY_ADMIN, 409);
    }
    throw new ApiError(AdminErrorMessages.EMAIL_USED_BY_PORTAL_ACCOUNT, 409);
  }

  const temporaryPassword = generateInvitePassword();
  const hashedPassword = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: Role.ADMIN,
      isVerified: true,
      adminInvitedAt: new Date(),
      createdByAdminId,
    },
    select: adminSelect,
  });

  try {
    await sendAdminInviteEmail({
      to: email,
      name,
      temporaryPassword,
    });
    logger.info(`Admin invite email sent to ${email}`);
  } catch (err) {
    logger.error(`Failed to send admin invite email to ${email}:`, err);
  }

  return admin;
}

export async function listAdmins(page: number = 1, pageSize: number = 20) {
  const skip = (page - 1) * pageSize;
  const where = { role: Role.ADMIN };

  const [admins, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      select: adminSelect,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    admins,
    meta: {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize,
    },
  };
}

export async function deleteAdmin(actorId: string, targetId: string) {
  if (actorId === targetId) {
    throw new ApiError(AdminErrorMessages.CANNOT_DELETE_SELF, 400);
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true },
  });
  if (!target || target.role !== Role.ADMIN) {
    throw new ApiError(AdminErrorMessages.ADMIN_NOT_FOUND, 404);
  }

  const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
  if (adminCount <= 1) {
    throw new ApiError(AdminErrorMessages.CANNOT_DELETE_LAST_ADMIN, 400);
  }

  await prisma.$transaction([
    prisma.refreshToken.deleteMany({ where: { userId: targetId } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: targetId } }),
    prisma.verificationToken.deleteMany({ where: { userId: targetId } }),
    prisma.user.delete({ where: { id: targetId } }),
  ]);
}
