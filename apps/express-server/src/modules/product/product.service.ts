import { Prisma } from "@smurfelite/types";
import prisma from "../../lib/prisma.js";
import { encrypt, decrypt } from "../../services/encryption.service.js";
import { ProductCreateInput } from "../../types/product.types.ts";
import ApiError from "../../utils/errors.ts";
import { ProductErrors } from "./product.messages.ts";

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

  const productInput: Omit<Prisma.ProductCreateInput, "seller"> = {
    ...safeData,
    ...encryptedData,
  };

  //  Save the product with encrypted bytes
  const product = await prisma.product.create({
    data: productInput as Prisma.ProductCreateInput,
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

export async function getProductDetails(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) throw new ApiError(ProductErrors.PRODUCT_NOT_FOUND, 404);

  // Check if the sensitive fields are actually Buffers (the expected type from DB)
  if (!(product.accountUsername instanceof Buffer)) {
    throw new ApiError(ProductErrors.PRODUCT_CORRUPTED, 500);
  }

  // 🛑 STEP 3: Decrypt the sensitive account details
  const decryptedCredentials = {
    accountUsername: decrypt(product.accountUsername),
    accountPassword: decrypt(product.accountPassword),
    accountEmail: decrypt(product.accountEmail),
    accountEmailPassword: decrypt(product.accountEmailPassword),
  };

  // 🛑 STEP 4: Return the full, decrypted product details
  return {
    ...product,
    ...decryptedCredentials,
  };
}
