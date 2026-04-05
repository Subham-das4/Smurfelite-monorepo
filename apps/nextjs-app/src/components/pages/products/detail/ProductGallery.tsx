"use client";

import { useState } from "react";
import type { ProductImage } from "./types";

interface ProductGalleryProps {
  images: ProductImage[];
  isVerifiedSeller: boolean;
}

const VISIBLE_THUMBNAILS = 3;

export function ProductGallery({ images, isVerifiedSeller }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const visibleThumbnails = images.slice(0, VISIBLE_THUMBNAILS);
  const extraCount = Math.max(0, images.length - VISIBLE_THUMBNAILS);
  const selectedImage = images[selectedIndex];

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden group shadow-2xl shadow-primary/5 border border-slate-200">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url('${selectedImage.url}')` }}
          role="img"
          aria-label={selectedImage.alt}
        />
        {isVerifiedSeller && (
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1 border border-white/10">
            <span className="material-symbols-outlined text-sm text-primary">
              verified
            </span>
            Verified Seller
          </div>
        )}
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-3">
        {visibleThumbnails.map((image, index) => (
          <button
            key={index}
            className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
              selectedIndex === index
                ? "border-primary"
                : "border-slate-200 hover:border-slate-400"
            }`}
            onClick={() => setSelectedIndex(index)}
            aria-label={`View image ${index + 1}: ${image.alt}`}
            aria-pressed={selectedIndex === index}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${image.url}')` }}
              role="img"
              aria-label={image.alt}
            />
          </button>
        ))}

        {extraCount > 0 && (
          <button
            className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 hover:border-slate-400 transition-colors bg-slate-100 flex items-center justify-center group cursor-pointer"
            onClick={() => setSelectedIndex(VISIBLE_THUMBNAILS)}
            aria-label={`View ${extraCount} more images`}
          >
            <span className="text-slate-700 font-bold text-sm group-hover:text-primary transition-colors">
              +{extraCount} More
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
