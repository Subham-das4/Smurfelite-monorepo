import Link from "next/link";
import type { SimilarProduct } from "./types";
import { SimilarProductCard } from "./SimilarProductCard";

interface SimilarProductsProps {
  products: SimilarProduct[];
}

export function SimilarProducts({ products }: SimilarProductsProps) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Similar Accounts</h2>
        <Link
          href="/products"
          className="text-primary text-sm font-bold hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <SimilarProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
