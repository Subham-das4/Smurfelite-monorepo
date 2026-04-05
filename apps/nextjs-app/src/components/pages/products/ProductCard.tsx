"use client";

import React from "react";
import { MdStar } from "react-icons/md";
import type { BadgeVariant, ProductListing } from "./types";

interface ProductCardProps {
  product: ProductListing;
  onBuy: (productId: string) => void;
}

const BADGE_STYLES: Record<BadgeVariant, string> = {
  prime: "bg-black/70 backdrop-blur-sm text-white border border-gray-600",
  "hot-deal": "bg-red-500/90 text-white backdrop-blur-sm",
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, onBuy }) => {
  const {
    id,
    gameType,
    title,
    price,
    originalPrice,
    rating,
    imageUrl,
    imageAlt,
    badge,
    platform,
    features,
  } = product;

  return (
    <div className="group flex flex-col h-full bg-white dark:bg-surface-dark rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-800">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {badge && (
          <span
            className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-md ${BADGE_STYLES[badge.variant]}`}
          >
            {badge.label}
          </span>
        )}

        <div
          className={`absolute top-3 right-3 ${platform.bgColor} p-1.5 rounded-full shadow-md`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={platform.iconUrl} alt={platform.name} className="w-4 h-4" />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 px-5 pt-4 pb-5">
        {/* Game label + Rating */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-primary text-xs font-bold uppercase tracking-widest">
            {gameType}
          </span>
          <div className="flex items-center gap-0.5">
            <MdStar className="text-yellow-400 text-sm" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {rating.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 leading-snug group-hover:text-primary transition-colors duration-200">
          {title}
        </h3>

        {/* Features */}
        <ul className="flex-1 mb-5 space-y-1.5">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400"
            >
              <span className="mt-0.5 text-primary font-bold leading-none select-none">
                •
              </span>
              {feature}
            </li>
          ))}
        </ul>

        {/* Price + CTA */}
        <div className="flex items-end justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div>
            {originalPrice != null ? (
              <span className="block text-xs text-gray-400 line-through mb-0.5">
                ${originalPrice.toFixed(2)}
              </span>
            ) : (
              <span className="block text-xs select-none opacity-0">·</span>
            )}
            <span className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">
              ${price.toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => onBuy(id)}
            className="bg-primary hover:bg-primary-hover active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-150 cursor-pointer shadow-sm hover:shadow-primary/30 hover:shadow-md"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};
