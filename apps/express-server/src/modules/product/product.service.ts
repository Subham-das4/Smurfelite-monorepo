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
import {
  assertGameAllowsNewListing,
} from "../game/game.service.js";
import {
  assertPlatformAllowsNewListing,
} from "../platform/platform.service.js";

function maskSensitiveFields<T extends Record<string, unknown>>(product: T) {
  return {
    ...product,
    accountUsername: "***ENCRYPTED***",
    accountPassword: "***ENCRYPTED***",
    accountEmail: "***ENCRYPTED***",
    accountEmailPassword: "***ENCRYPTED***",
  };
}

async function assertSellerCanList(sellerId: string) {
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { sellerDelisted: true, role: true },
  });
  if (!seller) {
    throw new ApiError(ProductErrors.PRODUCT_FORBIDDEN, 403);
  }
  if (seller.sellerDelisted) {
    throw new ApiError(ProductErrors.SELLER_ACCOUNT_DELISTED, 403);
  }
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
    gameId,
    platformId,
    gameType: _gameType,
    ...safeData
  } = data;

  await assertSellerCanList(sellerId);
  const game = await assertGameAllowsNewListing({
    gameId,
    gameType: _gameType,
  });
  const platformRecord = await assertPlatformAllowsNewListing({
    platformId,
  });

  const publish = options?.publish === true;
  const status = publish ? ProductStatus.ACTIVE : ProductStatus.DRAFT;
  const resolvedGameType = game?.name ?? _gameType ?? "";
  const resolvedPlatform = platformRecord?.name ?? "";

  const product = await prisma.product.create({
    data: {
      ...safeData,
      gameType: resolvedGameType,
      platform: resolvedPlatform,
      ...encryptedData,
      status,
      isAvailable: publish,
      sellerDelisted: false,
      seller: { connect: { id: sellerId } },
      ...(gameId ? { game: { connect: { id: gameId } } } : {}),
      ...(platformId
        ? { accountPlatform: { connect: { id: platformId } } }
        : {}),
    },
  });

  return maskSensitiveFields(product);
}

export async function publishProduct(productId: string) {
  const product = await getProductOrThrow(productId);
  await assertSellerCanList(product.sellerId);
  await assertGameAllowsNewListing({
    gameId: product.gameId,
    gameType: product.gameType,
  });
  await assertPlatformAllowsNewListing({
    platformId: product.platformId,
    platform: product.platform ?? undefined,
  });

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

  const credentialKeys: Array<keyof ProductUpdateData> = [
    "accountUsername",
    "accountPassword",
    "accountEmail",
    "accountEmailPassword",
  ];
  credentialKeys.forEach((key) => {
    if (!updateData[key]) return;
    (dataToUpdate as Record<string, unknown>)[key] = encrypt(
      updateData[key] as string
    );
  });

  const keysToSkip: Array<keyof ProductUpdateData> = [
    ...credentialKeys,
    "sellerId",
    "status",
    "sellerDelisted",
    "isAvailable",
    "gameId",
    "platformId",
    "gameType",
    "platform",
  ];

  if (updateData.gameId !== undefined) {
    const game = await assertGameAllowsNewListing({
      gameId: updateData.gameId,
      gameType: updateData.gameType,
    });
    dataToUpdate.game = updateData.gameId
      ? { connect: { id: updateData.gameId } }
      : { disconnect: true };
    if (game?.name) {
      dataToUpdate.gameType = game.name;
    }
  } else if (updateData.gameType !== undefined) {
    dataToUpdate.gameType = updateData.gameType;
  }

  if (updateData.platformId !== undefined) {
    const platformRecord = await assertPlatformAllowsNewListing({
      platformId: updateData.platformId,
      platform: updateData.platform ?? undefined,
    });
    dataToUpdate.accountPlatform = updateData.platformId
      ? { connect: { id: updateData.platformId } }
      : { disconnect: true };
    if (platformRecord?.name) {
      dataToUpdate.platform = platformRecord.name;
    }
  } else if (updateData.platform !== undefined) {
    dataToUpdate.platform = updateData.platform;
  }

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
        gameId: true,
        platformId: true,
        platform: true,
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

const productListSelect = {
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
  gameId: true,
  platformId: true,
  platform: true,
  createdAt: true,
  updatedAt: true,
} as const;

function buildPortalProductWhere(
  filters: ProductFilters,
  base: PrismaNamespace.Prisma.ProductWhereInput
): PrismaNamespace.Prisma.ProductWhereInput {
  const where: PrismaNamespace.Prisma.ProductWhereInput = { ...base };

  if (filters.status) {
    const statuses = filters.status
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean) as ProductStatus[];
    if (statuses.length === 1) {
      where.status = statuses[0];
    } else if (statuses.length > 1) {
      where.status = { in: statuses };
    }
  }

  if (filters.sellerId) {
    where.sellerId = filters.sellerId;
  }

  if (filters.search?.trim()) {
    where.OR = [
      { title: { contains: filters.search.trim(), mode: "insensitive" } },
      { description: { contains: filters.search.trim(), mode: "insensitive" } },
    ];
  }

  return where;
}

export async function getMyProducts(sellerId: string, filters: ProductFilters) {
  const { page, pageSize } = filters;
  const skip = (page - 1) * pageSize;
  const where = buildPortalProductWhere(filters, {
    sellerId,
    deletedAt: null,
  });

  const [products, totalCount] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      select: productListSelect,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    meta: {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize,
    },
  };
}

export async function getAdminProducts(filters: ProductFilters) {
  const { page, pageSize } = filters;
  const skip = (page - 1) * pageSize;
  const where = buildPortalProductWhere(filters, {});

  const [rows, totalCount] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      select: {
        ...productListSelect,
        deletedAt: true,
        seller: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  const products = rows.map(({ seller, ...p }) => ({
    ...p,
    sellerEmail: seller.email,
    sellerName: seller.name,
  }));

  return {
    products,
    meta: {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize,
    },
  };
}

export async function getAdminProductById(productId: string) {
  const row = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      ...productListSelect,
      deletedAt: true,
      seller: { select: { email: true, name: true } },
    },
  });

  if (!row) {
    throw new ApiError(ProductErrors.PRODUCT_NOT_FOUND, 404);
  }

  const { seller, ...product } = row;
  return {
    ...product,
    sellerEmail: seller.email,
    sellerName: seller.name,
  };
}
