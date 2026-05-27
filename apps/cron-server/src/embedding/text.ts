type ProductRow = {
  title: string;
  description: string | null;
  specifications: unknown;
  gameType: string;
};

export function buildProductEmbeddingText(product: ProductRow): string {
  const specs =
    product.specifications && typeof product.specifications === "object"
      ? JSON.stringify(product.specifications)
      : String(product.specifications ?? "");

  return [
    product.gameType,
    product.title,
    product.description ?? "",
    specs,
  ]
    .filter(Boolean)
    .join("\n")
    .trim();
}
