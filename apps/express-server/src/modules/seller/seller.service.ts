import bcrypt from "bcrypt";
import {
  Role,
  SellerApprovalStatus,
} from "../../types/prisma.js";
import { prisma } from "../../lib/prisma.js";
import ApiError from "../../utils/errors.js";
import logger from "../../utils/logger.js";
import { generateInvitePassword } from "../../lib/invite-password.js";
import { ensureSellerWallet } from "../wallet/wallet.service.js";
import { sendSellerInviteEmail } from "../../services/email/transactional.service.js";
import { SellerErrorMessages } from "./seller.messages.js";

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS!) || 10;

export const sellerSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isVerified: true,
  sellerApprovalStatus: true,
  sellerApprovedAt: true,
  sellerRejectedAt: true,
  sellerRejectionNote: true,
  adminInvitedAt: true,
  createdByAdminId: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const pendingInviteData = (createdByAdminId: string, hashedPassword: string) => ({
  role: Role.SELLER,
  password: hashedPassword,
  sellerApprovalStatus: SellerApprovalStatus.PENDING,
  sellerApprovedAt: null,
  sellerRejectedAt: null,
  sellerRejectionNote: null,
  isVerified: true,
  adminInvitedAt: new Date(),
  createdByAdminId,
});

async function sendInviteSafe(
  email: string,
  name: string,
  temporaryPassword: string
) {
  try {
    await sendSellerInviteEmail({ to: email, name, temporaryPassword });
    logger.info(`Seller invite email sent to ${email}`);
  } catch (err) {
    logger.error(`Failed to send seller invite email to ${email}:`, err);
  }
}

export async function createSellerInvite(
  createdByAdminId: string,
  input: { email: string; name: string }
) {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing?.role === Role.ADMIN) {
    throw new ApiError(SellerErrorMessages.EMAIL_ALREADY_ADMIN, 409);
  }

  const temporaryPassword = generateInvitePassword();
  const hashedPassword = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);

  if (!existing) {
    const seller = await prisma.user.create({
      data: {
        email,
        name,
        googleProfilePicture: "",
        ...pendingInviteData(createdByAdminId, hashedPassword),
      },
      select: sellerSelect,
    });
    await ensureSellerWallet(seller.id);
    await sendInviteSafe(email, name, temporaryPassword);
    return seller;
  }

  if (existing.role === Role.BUYER) {
    const seller = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name,
        ...pendingInviteData(createdByAdminId, hashedPassword),
      },
      select: sellerSelect,
    });
    await ensureSellerWallet(seller.id);
    await sendInviteSafe(email, name, temporaryPassword);
    return seller;
  }

  if (existing.role === Role.SELLER) {
    if (existing.sellerApprovalStatus === SellerApprovalStatus.PENDING) {
      throw new ApiError(SellerErrorMessages.SELLER_ALREADY_PENDING, 409);
    }
    if (existing.sellerApprovalStatus === SellerApprovalStatus.APPROVED) {
      throw new ApiError(SellerErrorMessages.SELLER_ALREADY_APPROVED, 409);
    }
    const seller = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name,
        ...pendingInviteData(createdByAdminId, hashedPassword),
      },
      select: sellerSelect,
    });
    await ensureSellerWallet(seller.id);
    await sendInviteSafe(email, name, temporaryPassword);
    return seller;
  }

  throw new ApiError(SellerErrorMessages.EMAIL_ALREADY_ADMIN, 409);
}

export async function listSellers(
  status: SellerApprovalStatus = SellerApprovalStatus.PENDING,
  page: number = 1,
  pageSize: number = 20
) {
  const skip = (page - 1) * pageSize;
  const where = { role: Role.SELLER, sellerApprovalStatus: status };

  const [sellers, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      select: sellerSelect,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    sellers,
    meta: {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize,
    },
  };
}

async function getSellerOrThrow(sellerId: string) {
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { id: true, role: true, sellerApprovalStatus: true },
  });
  if (!seller || seller.role !== Role.SELLER) {
    throw new ApiError(SellerErrorMessages.SELLER_NOT_FOUND, 404);
  }
  return seller;
}

export async function approveSeller(sellerId: string) {
  await getSellerOrThrow(sellerId);

  const seller = await prisma.user.update({
    where: { id: sellerId },
    data: {
      sellerApprovalStatus: SellerApprovalStatus.APPROVED,
      sellerApprovedAt: new Date(),
      sellerRejectedAt: null,
      sellerRejectionNote: null,
    },
    select: sellerSelect,
  });

  await ensureSellerWallet(sellerId);
  return seller;
}

export async function rejectSeller(sellerId: string, note?: string) {
  await getSellerOrThrow(sellerId);

  return prisma.user.update({
    where: { id: sellerId },
    data: {
      sellerApprovalStatus: SellerApprovalStatus.REJECTED,
      sellerRejectedAt: new Date(),
      sellerRejectionNote: note?.trim() || null,
      sellerApprovedAt: null,
    },
    select: sellerSelect,
  });
}
