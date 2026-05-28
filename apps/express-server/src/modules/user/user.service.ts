import { Role, ProductStatus } from "../../types/prisma.js";
import { prisma } from "../../lib/prisma.js";
import ApiError from "../../utils/errors.js";
import bcrypt from "bcrypt";
import { ensureSellerWallet } from "../wallet/wallet.service.js";

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
      lastLoginAt: true,
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
      lastLoginAt: true,
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

export const searchUsers = async (
  page: number = 1,
  pageSize: number = 20,
  search?: string
) => {
  const skip = (page - 1) * pageSize;
  const where =
    search?.trim()
      ? {
          OR: [
            { email: { contains: search.trim(), mode: "insensitive" as const } },
            { name: { contains: search.trim(), mode: "insensitive" as const } },
          ],
        }
      : {};

  const [users, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        sellerDelisted: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
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

export const getUserByIdAdmin = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isVerified: true,
      sellerDelisted: true,
      googleProfilePicture: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      cart: {
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              productId: true,
              quantity: true,
              product: {
                select: { id: true, title: true, price: true, status: true },
              },
            },
          },
        },
      },
      orders: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          totalAmount: true,
          createdAt: true,
        },
      },
      products: {
        take: 10,
        orderBy: { createdAt: "desc" },
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
          status: true,
          price: true,
          sellerDelisted: true,
          createdAt: true,
        },
      },
      sellerWallet: {
        select: {
          pendingBalance: true,
          availableBalance: true,
          frozenBalance: true,
          updatedAt: true,
        },
      },
      _count: {
        select: {
          orders: true,
          products: true,
        },
      },
    },
  });

  if (!user) throw new ApiError("User not found.", 404);
  return user;
};

export const getUserProductsAdmin = async (
  userId: string,
  page: number = 1,
  pageSize: number = 20
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true, name: true },
  });
  if (!user) throw new ApiError("User not found.", 404);

  const skip = (page - 1) * pageSize;
  const where = { sellerId: userId, deletedAt: null };

  const [products, totalCount] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        gameType: true,
        price: true,
        status: true,
        sellerDelisted: true,
        isAvailable: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    products,
    meta: {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize,
    },
  };
};

export const updateUserRole = async (userId: string, role: Role) => {
  if (role === Role.ADMIN) {
    throw new ApiError(
      "Admin accounts can only be created via POST /admins.",
      400
    );
  }

  if (!Object.values(Role).includes(role)) {
    throw new ApiError(
      `Invalid role. Must be one of: ${Object.values(Role).join(", ")}`,
      400
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError("User not found.", 404);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, name: true, role: true },
  });

  if (role === Role.SELLER) {
    await ensureSellerWallet(userId);
  }

  return updated;
};

export const promoteUserToSeller = async (userId: string) => {
  return updateUserRole(userId, Role.SELLER);
};

export const delistSellerByAdmin = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError("User not found.", 404);
  if (user.role !== Role.SELLER) {
    throw new ApiError("Only seller accounts can be delisted.", 400);
  }
  if (user.sellerDelisted) {
    return user;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { sellerDelisted: true },
    }),
    prisma.product.updateMany({
      where: {
        sellerId: userId,
        deletedAt: null,
        status: {
          notIn: [ProductStatus.SOLD, ProductStatus.BANNED_BY_ADMIN],
        },
      },
      data: { sellerDelisted: true, isAvailable: false },
    }),
  ]);

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      sellerDelisted: true,
    },
  });
};

export const reactivateSellerByAdmin = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError("User not found.", 404);
  if (user.role !== Role.SELLER) {
    throw new ApiError("Only seller accounts can be reactivated.", 400);
  }
  if (!user.sellerDelisted) {
    return user;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { sellerDelisted: false },
    }),
    prisma.product.updateMany({
      where: {
        sellerId: userId,
        deletedAt: null,
        sellerDelisted: true,
        status: { not: ProductStatus.DELISTED_BY_SELLER },
      },
      data: { sellerDelisted: false, isAvailable: true },
    }),
  ]);

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      sellerDelisted: true,
    },
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
