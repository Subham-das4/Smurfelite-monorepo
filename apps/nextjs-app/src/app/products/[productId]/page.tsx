import type { Metadata } from "next";
import { Breadcrumb } from "@/components/shared";
import { MOCK_PRODUCT } from "@/components/pages/products/detail/data";
import { ProductGallery } from "@/components/pages/products/detail/ProductGallery";
import { ProductPurchaseCard } from "@/components/pages/products/detail/ProductPurchaseCard";
import { AccountStats } from "@/components/pages/products/detail/AccountStats";
import { ProductTabs } from "@/components/pages/products/detail/ProductTabs";
import { ReviewsPanel } from "@/components/pages/products/detail/ReviewsPanel";
import { SimilarProducts } from "@/components/pages/products/detail/SimilarProducts";

interface PageProps {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { productId } = await params;
  // TODO: fetch real product data for metadata
  return {
    title: `${productId} — SmurfElite`,
    description: "Premium gaming account for sale on SmurfElite.",
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { productId } = await params;

  // TODO: replace with real API call using productId
  void productId;
  const product = MOCK_PRODUCT;

  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-8 py-6 md:py-10">
      {/* <Breadcrumb items={product.breadcrumb} /> */}

      {/* Hero: gallery + purchase card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <ProductGallery
            images={product.images}
            isVerifiedSeller={product.isVerifiedSeller}
          />
        </div>
        <div className="lg:col-span-5 flex flex-col h-full">
          <ProductPurchaseCard
            title={product.title}
            tags={product.tags}
            rating={product.rating}
            reviewCount={product.reviewCount}
            price={product.price}
            originalPrice={product.originalPrice}
            discountPercent={product.discountPercent}
          />
        </div>
      </div>

      {/* Account statistics */}
      <AccountStats stats={product.stats} />

      {/* Description tabs + Reviews sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ProductTabs
            description={product.description}
            highlights={product.highlights}
            specifications={product.specifications}
          />
        </div>
        <div className="lg:col-span-1">
          <ReviewsPanel
            overallRating={product.overallRating}
            reviewCount={product.reviewCount}
            reviews={product.reviews}
          />
        </div>
      </div>

      {/* Similar accounts */}
      <SimilarProducts products={product.similarProducts} />
    </main>
  );
}
