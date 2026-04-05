import { Role } from "@smurfelite/types";
import { prisma } from "../../lib/prisma.js";
import ApiError from "../../utils/errors.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS!) || 10;

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isVerified: true,
      googleProfilePicture: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) throw new ApiError("User not found.", 404);
  return user;
};

export const updateMe = async (
  userId: string,
  data: { name?: string; googleProfilePicture?: string }
) => {
  const allowed: Record<string, unknown> = {};
  if (data.name !== undefined) allowed.name = data.name;
  if (data.googleProfilePicture !== undefined)
    allowed.googleProfilePicture = data.googleProfilePicture;

  if (Object.keys(allowed).length === 0) {
    throw new ApiError("No valid fields to update.", 400);
  }

  return prisma.user.update({
    where: { id: userId },
    data: allowed,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isVerified: true,
      googleProfilePicture: true,
      updatedAt: true,
    },
  });
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError("User not found.", 404);

  if (!user.password) {
    throw new ApiError(
      "Password change is not available for OAuth-only accounts.",
      400
    );
  }

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw new ApiError("Current password is incorrect.", 401);

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
};

// ---- Admin: user management ----

export const getAllUsers = async (page: number = 1, pageSize: number = 20) => {
  const skip = (page - 1) * pageSize;
  const [users, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      skip,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count(),
  ]);

  return {
    users,
    meta: {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize,
    },
  };
};

export const updateUserRole = async (userId: string, role: Role) => {
  if (!Object.values(Role).includes(role)) {
    throw new ApiError(
      `Invalid role. Must be one of: ${Object.values(Role).join(", ")}`,
      400
    );
  }
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, name: true, role: true },
  });
};

export const deleteUser = async (adminId: string, targetUserId: string) => {
  if (adminId === targetUserId) {
    throw new ApiError("Admins cannot delete their own account.", 400);
  }
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw new ApiError("User not found.", 404);

  await prisma.user.delete({ where: { id: targetUserId } });
};
