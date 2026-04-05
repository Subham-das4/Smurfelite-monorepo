"use client";

import Link from "next/link";
import type { SimilarProduct } from "./types";

interface SimilarProductCardProps {
  product: SimilarProduct;
}

export function SimilarProductCard({ product }: SimilarProductCardProps) {
  const { id, title, subtitle, imageUrl, imageAlt, level, price } = product;

  return (
    <Link
      href={`/products/${id}`}
      className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-primary/50 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md block"
    >
      <div
        className="aspect-video bg-cover bg-center relative"
        style={{ backgroundImage: `url('${imageUrl}')` }}
        role="img"
        aria-label={imageAlt}
      >
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
          Level {level}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div>
          <h4 className="text-slate-900 font-bold leading-tight group-hover:text-primary transition-colors">
            {title}
          </h4>
          <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-slate-900 font-bold text-lg">
            ${price.toFixed(2)}
          </span>
          <button
            className="size-8 rounded-lg bg-slate-100 text-slate-700 hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
            onClick={(e) => {
              e.preventDefault();
              // TODO: dispatch addToCart action
            }}
            aria-label={`Add ${title} to cart`}
          >
            <span className="material-symbols-outlined text-[18px]">
              add_shopping_cart
            </span>
          </button>
        </div>
      </div>
    </Link>
  );
}
