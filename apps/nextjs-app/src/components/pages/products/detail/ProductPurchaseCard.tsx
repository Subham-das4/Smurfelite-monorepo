"use client";

import { MdStar } from "react-icons/md";
import type { ProductTag } from "./types";

interface TrustFeature {
  icon: string;
  label: string;
  iconBg: string;
  iconColor: string;
}

const TRUST_FEATURES: TrustFeature[] = [
  {
    icon: "bolt",
    label: "Instant delivery to your email",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: "verified_user",
    label: "Lifetime Warranty included",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: "lock",
    label: "Secure SSL Payment",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
];

interface ProductPurchaseCardProps {
  title: string;
  tags: ProductTag[];
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice: number;
  discountPercent: number;
}

export function ProductPurchaseCard({
  title,
  tags,
  rating,
  reviewCount,
  price,
  originalPrice,
  discountPercent,
}: ProductPurchaseCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 flex flex-col gap-6 h-fit sticky top-24">
      {/* Tags + Title + Rating */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {tags.map((tag) => (
            <span
              key={tag.label}
              className={
                tag.variant === "primary"
                  ? "px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/20"
                  : "px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200"
              }
            >
              {tag.label}
            </span>
          ))}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold leading-tight text-slate-900">
          {title}
        </h1>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="flex text-amber-400">
            {Array.from({ length: 5 }, (_, i) => (
              <MdStar key={i} className="text-[20px]" />
            ))}
          </div>
          <span className="text-slate-900 font-medium">{rating.toFixed(1)}</span>
          <span>({reviewCount} Reviews)</span>
        </div>
      </div>

      <div className="h-px bg-slate-100 w-full" />

      {/* Price + Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
            ${price.toFixed(2)}
          </span>
          <span className="text-xl text-slate-400 line-through font-medium">
            ${originalPrice.toFixed(2)}
          </span>
          <span className="ml-auto text-green-600 text-sm font-bold bg-green-100 px-2 py-1 rounded">
            Save {discountPercent}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <button
            className="col-span-2 h-14 bg-primary hover:bg-primary/90 text-white text-lg font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(127,19,236,0.15)] hover:shadow-[0_0_30px_rgba(127,19,236,0.3)] flex items-center justify-center gap-2"
            onClick={() => {}}
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            Add to Cart
          </button>
          <button
            className="h-12 border border-slate-200 hover:bg-slate-50 text-slate-900 font-bold rounded-xl transition-colors"
            onClick={() => {}}
          >
            Buy Now
          </button>
          <button
            className="h-12 border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-red-400 rounded-xl transition-colors flex items-center justify-center"
            onClick={() => {}}
            aria-label="Add to wishlist"
          >
            <span className="material-symbols-outlined">favorite</span>
          </button>
        </div>
      </div>

      {/* Trust features */}
      <div className="flex flex-col gap-3 pt-4">
        {TRUST_FEATURES.map((feature) => (
          <div
            key={feature.label}
            className="flex items-center gap-3 text-sm text-slate-600"
          >
            <div
              className={`${feature.iconBg} p-1 rounded-full ${feature.iconColor}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {feature.icon}
              </span>
            </div>
            <span className="text-slate-900">{feature.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
