"use client";

import React from "react";
import Link from "next/link";
import type { ProductListItem } from "@smurfelite/types";

const PLACEHOLDER_GRADIENT =
  "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)";

interface ProductCardProps {
  product: ProductListItem;
  onBuy: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onBuy }) => {
  const { id, gameType, title, description, price, imageUrl } = product;

  return (
    <Link
      href={`/products/${id}`}
      className="group flex flex-col h-full bg-white dark:bg-surface-dark rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-800"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-900">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full transition-transform duration-500 group-hover:scale-105"
            style={{ background: PLACEHOLDER_GRADIENT }}
          />
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 px-5 pt-4 pb-5">
        {/* Game label */}
        <div className="mb-2">
          <span className="text-primary text-xs font-bold uppercase tracking-widest">
            {gameType}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 leading-snug group-hover:text-primary transition-colors duration-200">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="grow mb-5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {description}
          </p>
        )}

        {/* Price + CTA */}
        <div className="flex items-end justify-between pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
          <div>
            <span className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">
              ${price.toFixed(2)}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              onBuy(id);
            }}
            className="bg-primary hover:bg-primary-hover active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-150 cursor-pointer shadow-sm hover:shadow-primary/30 hover:shadow-md"
          >
            Buy Now
          </button>
        </div>
      </div>
    </Link>
  );
};
