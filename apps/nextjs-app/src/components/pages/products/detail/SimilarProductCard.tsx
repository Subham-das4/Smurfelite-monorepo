"use client";

import Link from "next/link";
import type { ProductListItem } from "@smurfelite/types";

const PLACEHOLDER_GRADIENT =
  "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)";

interface SimilarProductCardProps {
  product: ProductListItem;
}

export function SimilarProductCard({ product }: SimilarProductCardProps) {
  const { id, title, gameType, imageUrl, price } = product;

  return (
    <Link
      href={`/products/${id}`}
      className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-primary/50 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md block"
    >
      <div
        className="aspect-video bg-cover bg-center relative"
        style={{
          backgroundImage: imageUrl ? `url('${imageUrl}')` : undefined,
          background: imageUrl ? undefined : PLACEHOLDER_GRADIENT,
        }}
        role="img"
        aria-label={title}
      />

      <div className="p-4 flex flex-col gap-2">
        <span className="text-primary text-xs font-bold uppercase tracking-widest">
          {gameType}
        </span>
        <h4 className="text-slate-900 font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h4>
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-slate-900 font-bold text-lg">
            ${price.toFixed(2)}
          </span>
        </div>
      </div>
    </Link>
  );
}
