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

export async function checkProductOwnership(
  productId: string,
  sellerId: string
): Promise<boolean> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sellerId: true },
  });

  if (!product) {
    throw new ApiError(ProductErrors.PRODUCT_NOT_FOUND, 404);
  }

  if (product.sellerId !== sellerId) {
    throw new ApiError(ProductErrors.PRODUCT_FORBIDDEN, 403);
  }

  return true;
}

export async function createProduct(data: ProductCreateInput) {
  //  Encrypt sensitive fields before saving
  const encryptedData = {
    accountUsername: encrypt(data.accountUsername),
    accountPassword: encrypt(data.accountPassword),
    accountEmail: encrypt(data.accountEmail),
    accountEmailPassword: encrypt(data.accountEmailPassword),
  };

  // Destructure to exclude sensitive fields from data
  const {
    accountUsername,
    accountPassword,
    accountEmail,
    accountEmailPassword,
    ...safeData
  } = data;

  const productInput: Omit<
    PrismaNamespace.Prisma.ProductCreateInput,
    "seller"
  > = {
    ...safeData,
    ...encryptedData,
  };

  //  Save the product with encrypted bytes
  const product = await prisma.product.create({
    data: productInput as PrismaNamespace.Prisma.ProductCreateInput,
  });

  // We return the actual Product type from the DB, masking sensitive fields
  return {
    ...product,
    accountUsername: "***ENCRYPTED***",
    accountPassword: "***ENCRYPTED***",
    accountEmail: "***ENCRYPTED***",
    accountEmailPassword: "***ENCRYPTED***",
  };
}

export async function getProductDetails(
  productId: string,
  decryptData: boolean = false
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) throw new ApiError(ProductErrors.PRODUCT_NOT_FOUND, 404);
  // Check if the sensitive fields are actually Buffers (the expected type from DB)
  if (!Buffer.isBuffer(product.accountEmail)) {
    // If it's a Uint8Array but not a "Buffer", convert it
    if (product.accountEmail instanceof Uint8Array) {
      product.accountEmail = Buffer.from(product.accountEmail);
    } else {
      throw new ApiError(ProductErrors.PRODUCT_CORRUPTED, 500);
    }
  }

  // 🛑 STEP 3: Decrypt the sensitive account details
  let decryptedCredentials: Record<string, string> = {};
  if (decryptData) {
    decryptedCredentials = {
      accountUsername: decrypt(Buffer.from(product.accountUsername)),
      accountPassword: decrypt(Buffer.from(product.accountPassword)),
      accountEmail: decrypt(Buffer.from(product.accountEmail)),
      accountEmailPassword: decrypt(Buffer.from(product.accountEmailPassword)),
    };
  }
  else {
    delete (product as any).accountUsername;
    delete (product as any).accountPassword;
    delete (product as any).accountEmail;
    delete (product as any).accountEmailPassword;
  }

  // 🛑 STEP 4: Return the full, decrypted product details
  return {
    ...product,
    ...decryptedCredentials,
  };
}

export async function updateProduct(
  productId: string,
  updateData: ProductUpdateData
) {
  // 1. Authorization Check (Placeholder): Ensure the user modifying the product is the seller.
  // In a real app, you would fetch the product and compare its sellerId to the current user's ID.
  // For now, we assume this check happens successfully, or the caller is an Admin.

  const dataToUpdate: PrismaNamespace.Prisma.ProductUpdateInput = {};

  // 2. Encrypt sensitive fields if they are included in the update payload
  const keysToSkip: Array<keyof ProductUpdateData> = [
    "accountUsername",
    "accountPassword",
    "accountEmail",
    "accountEmailPassword",
    "sellerId",
  ];
  keysToSkip.forEach((key) => {
    if (!updateData[key]) return;
    (dataToUpdate as any)[key] = encrypt(updateData[key] as string);
  });

  // 3. Include non-sensitive fields
  // We iterate through the updateData keys and assign non-sensitive fields directly
  for (const key in updateData) {
    if (
      !keysToSkip.includes(key as keyof ProductUpdateData) &&
      updateData[key as keyof ProductUpdateData] !== undefined
    ) {
      (dataToUpdate as any)[key] = updateData[key as keyof ProductUpdateData];
    }
  }

  // 4. Perform the update
  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: dataToUpdate,
  });

  return {
    ...updatedProduct,
    accountUsername: "***ENCRYPTED***", // Mask sensitive data
  };
}

export async function deleteProduct(productId: string) {
  // 1. Authorization Check (Placeholder): Ensure the current user is the seller or an Admin.

  // 2. Delete the product
  try {
    await prisma.product.delete({
      where: { id: productId },
    });
    return true;
  } catch (error) {
    // Handle case where product might not exist
    if (
      error instanceof PrismaNamespace.Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new ApiError(ProductErrors.PRODUCT_NOT_FOUND, 404);
    }
    throw new ApiError(ProductErrors.PRODUCT_DELETION_FAILED, 500);
  }
}

export async function getAllProducts(filters: ProductFilters) {
  const { page, pageSize, sortBy, sortOrder } = filters;

  // 1. Build the WHERE clause (same as before)
  const where: PrismaNamespace.Prisma.ProductWhereInput = {
    isAvailable: true, // Only show active listings
  };

  if (filters.gameType) {
    // Support comma-separated game types, e.g. "Valorant,CS:GO 2"
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

  const orderBy: PrismaNamespace.Prisma.ProductOrderByWithRelationInput[] = [
  ];

  if (sortBy && sortOrder) {
    if (typeof sortBy === "string") {
      // Key mapping order is important in Prisma; we set the primary sort first
      orderBy.push({ [sortBy]: sortOrder });
    }
  }

  orderBy.push({ createdAt: "desc" });

  // We need two queries: one for the paginated data, one for the total count.
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
        isAvailable: true,
        specifications: true,
        imageUrl: true,
        sellerId: true,
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
