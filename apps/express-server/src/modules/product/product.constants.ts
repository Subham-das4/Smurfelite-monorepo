import { ProductStatus, SellerApprovalStatus } from "../../types/prisma.js";

/** Products visible on the public storefront and eligible for purchase. */
export const PUBLIC_LISTABLE_PRODUCT_WHERE = {
  status: ProductStatus.ACTIVE,
  sellerDelisted: false,
  isAvailable: true,
  deletedAt: null,
  seller: {
    sellerDelisted: false,
    sellerApprovalStatus: SellerApprovalStatus.APPROVED,
  },
} as const;

export function isSellerStorefrontApproved(seller: {
  sellerDelisted: boolean;
  sellerApprovalStatus: SellerApprovalStatus;
}): boolean {
  return (
    !seller.sellerDelisted &&
    seller.sellerApprovalStatus === SellerApprovalStatus.APPROVED
  );
}

/** Whether a product can be added to cart or checked out. */
export function isProductPurchasable(product: {
  status: ProductStatus;
  sellerDelisted: boolean;
  isAvailable: boolean;
  transactionBlock: boolean;
  seller?: {
    sellerDelisted: boolean;
    sellerApprovalStatus: SellerApprovalStatus;
  };
}): boolean {
  if (
    product.status !== ProductStatus.ACTIVE ||
    product.sellerDelisted ||
    !product.isAvailable ||
    product.transactionBlock
  ) {
    return false;
  }

  if (product.seller && !isSellerStorefrontApproved(product.seller)) {
    return false;
  }

  return true;
}
