import * as PrismaNamespace from "../../types/prisma.js";
import prisma from "../../lib/prisma.js";
import { encrypt, decrypt } from "../../services/encryption.service.js";
import {
  ProductCreateInput,
  ProductFilters,
  ProductUpdateData,
} from "../../types/product.types.js";
import ApiError from "../../utils/errors.js";
import { ProductErrors } from "./product.messages.js";
import { ProductStatus } from "../../types/prisma.js";
import { PUBLIC_LISTABLE_PRODUCT_WHERE } from "./product.constants.js";

function maskSensitiveFields<T extends Record<string, unknown>>(product: T) {
  return {
    ...product,
    accountUsername: "***ENCRYPTED***",
    accountPassword: "***ENCRYPTED***",
    accountEmail: "***ENCRYPTED***",
    accountEmailPassword: "***ENCRYPTED***",
  };
}

async function getProductOrThrow(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product || product.deletedAt) {
    throw new ApiError(ProductErrors.PRODUCT_NOT_FOUND, 404);
  }
  return product;
}

export async function checkProductOwnership(
  productId: string,
  sellerId: string
): Promise<boolean> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sellerId: true, deletedAt: true },
  });

  if (!product || product.deletedAt) {
    throw new ApiError(ProductErrors.PRODUCT_NOT_FOUND, 404);
  }

  if (product.sellerId !== sellerId) {
    throw new ApiError(ProductErrors.PRODUCT_FORBIDDEN, 403);
  }

  return true;
}

export async function createProduct(
  sellerId: string,
  data: ProductCreateInput,
  options?: { publish?: boolean }
) {
  const encryptedData = {
    accountUsername: encrypt(data.accountUsername),
    accountPassword: encrypt(data.accountPassword),
    accountEmail: encrypt(data.accountEmail),
    accountEmailPassword: encrypt(data.accountEmailPassword),
  };

  const {
    accountUsername,
    accountPassword,
    accountEmail,
    accountEmailPassword,
    sellerId: _sellerId,
    gameCategoryId,
    ...safeData
  } = data;

  const publish = options?.publish === true;
  const status = publish ? ProductStatus.ACTIVE : ProductStatus.DRAFT;

  const product = await prisma.product.create({
    data: {
      ...safeData,
      ...encryptedData,
      status,
      isAvailable: publish,
      sellerDelisted: false,
      seller: { connect: { id: sellerId } },
      ...(gameCategoryId
        ? { gameCategory: { connect: { id: gameCategoryId } } }
        : {}),
    },
  });

  return maskSensitiveFields(product);
}

export async function publishProduct(productId: string) {
  const product = await getProductOrThrow(productId);

  if (product.status === ProductStatus.BANNED_BY_ADMIN) {
    throw new ApiError(ProductErrors.INVALID_STATUS_TRANSITION, 400);
  }
  if (product.status === ProductStatus.SOLD) {
    throw new ApiError(ProductErrors.INVALID_STATUS_TRANSITION, 400);
  }
  if (product.status === ProductStatus.ACTIVE) {
    throw new ApiError(ProductErrors.PRODUCT_ALREADY_PUBLISHED, 400);
  }
  if (product.status !== ProductStatus.DRAFT) {
    throw new ApiError(ProductErrors.PRODUCT_NOT_DRAFT, 400);
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      status: ProductStatus.ACTIVE,
      isAvailable: true,
      sellerDelisted: false,
    },
  });

  return maskSensitiveFields(updated);
}

export async function delistProductBySeller(productId: string) {
  const product = await getProductOrThrow(productId);

  if (product.status === ProductStatus.BANNED_BY_ADMIN) {
    throw new ApiError(ProductErrors.INVALID_STATUS_TRANSITION, 400);
  }
  if (product.status === ProductStatus.SOLD) {
    throw new ApiError(ProductErrors.INVALID_STATUS_TRANSITION, 400);
  }
  if (product.status !== ProductStatus.ACTIVE) {
    throw new ApiError(ProductErrors.PRODUCT_NOT_DELISTABLE, 400);
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      status: ProductStatus.DELISTED_BY_SELLER,
      sellerDelisted: true,
      isAvailable: false,
    },
  });

  return maskSensitiveFields(updated);
}

export async function reactivateProductBySeller(productId: string) {
  const product = await getProductOrThrow(productId);

  if (product.status === ProductStatus.BANNED_BY_ADMIN) {
    throw new ApiError(ProductErrors.INVALID_STATUS_TRANSITION, 400);
  }
  if (product.status === ProductStatus.SOLD) {
    throw new ApiError(ProductErrors.INVALID_STATUS_TRANSITION, 400);
  }
  if (product.status !== ProductStatus.DELISTED_BY_SELLER) {
    throw new ApiError(ProductErrors.PRODUCT_NOT_REACTIVATABLE, 400);
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      status: ProductStatus.ACTIVE,
      sellerDelisted: false,
      isAvailable: true,
    },
  });

  return maskSensitiveFields(updated);
}

export async function banProductByAdmin(productId: string) {
  const product = await getProductOrThrow(productId);

  if (product.status === ProductStatus.SOLD) {
    throw new ApiError(ProductErrors.PRODUCT_NOT_BANNABLE, 400);
  }
  if (product.status === ProductStatus.BANNED_BY_ADMIN) {
    return maskSensitiveFields(product);
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      status: ProductStatus.BANNED_BY_ADMIN,
      isAvailable: false,
    },
  });

  return maskSensitiveFields(updated);
}

export async function liftBanProductByAdmin(productId: string) {
  const product = await getProductOrThrow(productId);

  if (product.status !== ProductStatus.BANNED_BY_ADMIN) {
    throw new ApiError(ProductErrors.PRODUCT_NOT_BANNED, 400);
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      status: ProductStatus.ACTIVE,
      sellerDelisted: false,
      isAvailable: true,
    },
  });

  return maskSensitiveFields(updated);
}

export async function getProductDetails(
  productId: string,
  decryptData: boolean = false
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) throw new ApiError(ProductErrors.PRODUCT_NOT_FOUND, 404);

  if (
    product.status !== ProductStatus.ACTIVE ||
    product.sellerDelisted ||
    !product.isAvailable ||
    product.deletedAt
  ) {
    throw new ApiError(ProductErrors.PRODUCT_NOT_FOUND, 404);
  }

  if (!Buffer.isBuffer(product.accountEmail)) {
    if (product.accountEmail instanceof Uint8Array) {
      product.accountEmail = Buffer.from(product.accountEmail);
    } else {
      throw new ApiError(ProductErrors.PRODUCT_CORRUPTED, 500);
    }
  }

  let decryptedCredentials: Record<string, string> = {};
  if (decryptData) {
    decryptedCredentials = {
      accountUsername: decrypt(Buffer.from(product.accountUsername)),
      accountPassword: decrypt(Buffer.from(product.accountPassword)),
      accountEmail: decrypt(Buffer.from(product.accountEmail)),
      accountEmailPassword: decrypt(Buffer.from(product.accountEmailPassword)),
    };
  } else {
    delete (product as Record<string, unknown>).accountUsername;
    delete (product as Record<string, unknown>).accountPassword;
    delete (product as Record<string, unknown>).accountEmail;
    delete (product as Record<string, unknown>).accountEmailPassword;
  }

  return {
    ...product,
    ...decryptedCredentials,
  };
}

export async function updateProduct(
  productId: string,
  updateData: ProductUpdateData
) {
  await getProductOrThrow(productId);

  const dataToUpdate: PrismaNamespace.Prisma.ProductUpdateInput = {};

  const keysToSkip: Array<keyof ProductUpdateData> = [
    "accountUsername",
    "accountPassword",
    "accountEmail",
    "accountEmailPassword",
    "sellerId",
    "status",
    "sellerDelisted",
    "isAvailable",
  ];
  keysToSkip.forEach((key) => {
    if (!updateData[key]) return;
    (dataToUpdate as Record<string, unknown>)[key] = encrypt(
      updateData[key] as string
    );
  });

  for (const key in updateData) {
    if (
      !keysToSkip.includes(key as keyof ProductUpdateData) &&
      updateData[key as keyof ProductUpdateData] !== undefined
    ) {
      (dataToUpdate as Record<string, unknown>)[key] =
        updateData[key as keyof ProductUpdateData];
    }
  }

  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: dataToUpdate,
  });

  return maskSensitiveFields(updatedProduct);
}

export async function softDeleteProduct(productId: string) {
  const product = await getProductOrThrow(productId);

  if (product.deletedAt) {
    throw new ApiError(ProductErrors.PRODUCT_ALREADY_DELETED, 400);
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      deletedAt: new Date(),
      isAvailable: false,
    },
  });

  return true;
}

export async function getAllProducts(filters: ProductFilters) {
  const { page, pageSize, sortBy, sortOrder } = filters;

  const where: PrismaNamespace.Prisma.ProductWhereInput = {
    ...PUBLIC_LISTABLE_PRODUCT_WHERE,
  };

  if (filters.gameType) {
    const gameTypes = filters.gameType.split(",").map((g) => g.trim()).filter(Boolean);
    if (gameTypes.length === 1) {
      where.gameType = { contains: gameTypes[0], mode: "insensitive" };
    } else if (gameTypes.length > 1) {
      where.OR = gameTypes.map((g) => ({
        gameType: { contains: g, mode: "insensitive" },
      }));
    }
  }

  const priceFilter: PrismaNamespace.Prisma.FloatFilter = {};
  if (filters.minPrice) {
    priceFilter.gte = parseFloat(filters.minPrice);
  }
  if (filters.maxPrice) {
    priceFilter.lte = parseFloat(filters.maxPrice);
  }
  if (Object.keys(priceFilter).length > 0) {
    where.price = priceFilter;
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const take = pageSize;
  const skip = (page - 1) * pageSize;

  const orderBy: PrismaNamespace.Prisma.ProductOrderByWithRelationInput[] = [];

  if (sortBy && sortOrder) {
    if (typeof sortBy === "string") {
      orderBy.push({ [sortBy]: sortOrder });
    }
  }

  orderBy.push({ createdAt: "desc" });

  const [products, totalCount] = await prisma.$transaction([
    prisma.product.findMany({
      skip: skip,
      take: take,
      where: where,
      select: {
        id: true,
        gameType: true,
        title: true,
        description: true,
        price: true,
        status: true,
        sellerDelisted: true,
        isAvailable: true,
        specifications: true,
        imageUrl: true,
        sellerId: true,
        gameCategoryId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: orderBy,
    }),
    prisma.product.count({ where: where }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    products,
    meta: {
      totalCount,
      totalPages,
      currentPage: page,
      pageSize,
      sortBy,
      sortOrder,
    },
  };
}
