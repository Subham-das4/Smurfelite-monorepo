import type { ProductListItem } from "@smurfelite/types";
import { ProductStatus, SellerApprovalStatus } from "@smurfelite/types";

export interface CheckoutAvailabilityIssue {
  productId: string;
  title: string;
  reason: string;
}

export function isProductPurchasableForCheckout(product: ProductListItem): boolean {
  const sellerApproved =
    product.sellerApprovalStatus === undefined ||
    product.sellerApprovalStatus === SellerApprovalStatus.APPROVED;

  return (
    product.status === ProductStatus.ACTIVE &&
    !product.sellerDelisted &&
    product.isAvailable &&
    sellerApproved
  );
}

export function getCheckoutUnavailableReason(product: ProductListItem): string {
  if (product.status === "SOLD") {
    return "This account was sold.";
  }
  if (!product.isAvailable) {
    return "No longer available.";
  }
  if (product.sellerDelisted) {
    return "Delisted by the seller.";
  }
  if (
    product.sellerApprovalStatus !== undefined &&
    product.sellerApprovalStatus !== SellerApprovalStatus.APPROVED
  ) {
    return "Seller is not approved for storefront listings.";
  }
  if (product.status !== "ACTIVE") {
    return "Not available for purchase.";
  }
  return "Unavailable.";
}

export function findCheckoutAvailabilityIssues(
  productIds: string[],
  productById: Map<string, ProductListItem>,
): CheckoutAvailabilityIssue[] {
  const issues: CheckoutAvailabilityIssue[] = [];
  const seen = new Set<string>();

  for (const productId of productIds) {
    if (!productId || seen.has(productId)) continue;
    seen.add(productId);

    const product = productById.get(productId);
    if (!product) {
      issues.push({
        productId,
        title: "Unknown product",
        reason: "Could not be loaded. It may have been removed.",
      });
      continue;
    }

    if (!isProductPurchasableForCheckout(product)) {
      issues.push({
        productId,
        title: product.title,
        reason: getCheckoutUnavailableReason(product),
      });
    }
  }

  return issues;
}

export function isOrderUnavailableError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("no longer available") ||
    lower.includes("not available") ||
    lower.includes("no longer exist")
  );
}
