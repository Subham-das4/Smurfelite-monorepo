import type { CartItemResponse, ProductListItem } from "@smurfelite/types";

export function syntheticCartLineFromProduct(
  product: ProductListItem,
  quantity: number,
): CartItemResponse {
  return {
    cartId: "",
    productId: product.id,
    quantity,
    product: {
      id: product.id,
      title: product.title,
      gameType: product.gameType,
      price: product.price,
      specifications: product.specifications ?? {},
      imageUrl: product.imageUrl ?? null,
    },
  };
}

/** Build merged line items from ordered product ids and loaded catalogue rows. */
export function buildScopedCheckoutLines(
  orderedProductIds: string[],
  productById: Map<string, ProductListItem>,
): CartItemResponse[] {
  const counts = new Map<string, number>();
  for (const id of orderedProductIds) {
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const lines: CartItemResponse[] = [];
  for (const [id, quantity] of counts) {
    const p = productById.get(id);
    if (p) lines.push(syntheticCartLineFromProduct(p, quantity));
  }
  return lines;
}

/** Expand quantities into the flat array expected by createOrder. */
export function expandProductIdsForOrder(orderedProductIds: string[]): string[] {
  const out: string[] = [];
  for (const id of orderedProductIds) {
    if (id) out.push(id);
  }
  return out;
}
