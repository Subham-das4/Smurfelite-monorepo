import type { Metadata } from "next";
import type { ProductListItem, ProductListResponse } from "@smurfelite/types";
import { ProductGallery } from "@/components/pages/products/detail/ProductGallery";
import { ProductPurchaseCard } from "@/components/pages/products/detail/ProductPurchaseCard";
import { AccountStats } from "@/components/pages/products/detail/AccountStats";
import { ProductTabs } from "@/components/pages/products/detail/ProductTabs";
import { SimilarProducts } from "@/components/pages/products/detail/SimilarProducts";

interface PageProps {
  params: Promise<{ productId: string }>;
}

/** Convert a Record<string, unknown> specifications object into a {key, value}[] array */
function specToArray(spec: Record<string, unknown>): { key: string; value: string }[] {
  return Object.entries(spec).map(([key, value]) => ({
    key,
    value: String(value),
  }));
}

async function fetchProduct(productId: string): Promise<ProductListItem | null> {
  const apiBase =
    process.env.EXPRESS_SERVER_API ?? process.env.NEXT_PUBLIC_EXPRESS_SERVER_API;
  if (!apiBase) return null;
  try {
    const res = await fetch(`${apiBase}/products/${productId}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as ProductListItem;
  } catch {
    return null;
  }
}

async function fetchSimilarProducts(
  gameType: string,
  excludeId: string,
): Promise<ProductListItem[]> {
  const apiBase =
    process.env.EXPRESS_SERVER_API ?? process.env.NEXT_PUBLIC_EXPRESS_SERVER_API;
  if (!apiBase) return [];
  try {
    const qs = new URLSearchParams({
      gameType,
      pageSize: "5",
    });
    const res = await fetch(`${apiBase}/products?${qs.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as ProductListResponse;
    return (data.products ?? []).filter((p) => p.id !== excludeId).slice(0, 4);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await fetchProduct(productId);
  if (!product) {
    return {
      title: "Product Not Found — SmurfElite",
      description: "This product could not be found.",
    };
  }
  return {
    title: `${product.title} — SmurfElite`,
    description: product.description ?? "Premium gaming account for sale on SmurfElite.",
    openGraph: {
      title: product.title,
      description: product.description ?? undefined,
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { productId } = await params;

  const product = await fetchProduct(productId);

  if (!product) {
    return (
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h1>
        <p className="text-slate-500">
          This product may have been removed or is no longer available.
        </p>
      </main>
    );
  }

  const specs = specToArray(product.specifications as Record<string, unknown>);
  const images = product.imageUrl ? [product.imageUrl] : [];
  const similarProducts = await fetchSimilarProducts(product.gameType, product.id);

  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-8 py-6 md:py-10">
      {/* Hero: gallery + purchase card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <ProductGallery images={images} />
        </div>
        <div className="lg:col-span-5 flex flex-col h-full">
          <ProductPurchaseCard
            id={product.id}
            title={product.title}
            gameType={product.gameType}
            price={product.price}
            imageUrl={product.imageUrl}
          />
        </div>
      </div>

      {/* Account statistics derived from specifications */}
      <AccountStats specs={specs} />

      {/* Description + Specifications (reviews panel hidden — see detail/config.ts) */}
      <div className="mb-16">
        <ProductTabs description={product.description} specs={specs} />
      </div>

      {/* Similar accounts */}
      <SimilarProducts products={similarProducts} />
    </main>
  );
}
