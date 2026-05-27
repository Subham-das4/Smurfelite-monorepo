import { ProductStatus } from "../../types/prisma.js";

/** Products visible on the public storefront and eligible for purchase. */
export const PUBLIC_LISTABLE_PRODUCT_WHERE = {
  status: ProductStatus.ACTIVE,
  sellerDelisted: false,
  isAvailable: true,
  deletedAt: null,
} as const;

/** Whether a product can be added to cart or checked out. */
export function isProductPurchasable(product: {
  status: ProductStatus;
  sellerDelisted: boolean;
  isAvailable: boolean;
  transactionBlock: boolean;
}): boolean {
  return (
    product.status === ProductStatus.ACTIVE &&
    !product.sellerDelisted &&
    product.isAvailable &&
    !product.transactionBlock
  );
}
