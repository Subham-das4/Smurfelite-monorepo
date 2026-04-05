"use client";

import { useState } from "react";

interface ProductGalleryProps {
  images: string[];
  isVerifiedSeller?: boolean;
}

const VISIBLE_THUMBNAILS = 3;

const PLACEHOLDER_GRADIENT =
  "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)";

export function ProductGallery({ images, isVerifiedSeller }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const visibleThumbnails = images.slice(0, VISIBLE_THUMBNAILS);
  const extraCount = Math.max(0, images.length - VISIBLE_THUMBNAILS);
  const selectedImage = images[selectedIndex];

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden group shadow-2xl shadow-primary/5 border border-slate-200">
        {selectedImage ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url('${selectedImage}')` }}
            role="img"
            aria-label="Product image"
          />
        ) : (
          <div
            className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
            style={{ background: PLACEHOLDER_GRADIENT }}
            role="img"
            aria-label="Product placeholder"
          />
        )}
        {isVerifiedSeller && (
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1 border border-white/10">
            <span className="material-symbols-outlined text-sm text-primary">
              verified
            </span>
            Verified Seller
          </div>
        )}
      </div>

      {/* Thumbnails — only show when there are multiple images */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {visibleThumbnails.map((url, index) => (
            <button
              key={index}
              className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
                selectedIndex === index
                  ? "border-primary"
                  : "border-slate-200 hover:border-slate-400"
              }`}
              onClick={() => setSelectedIndex(index)}
              aria-label={`View image ${index + 1}`}
              aria-pressed={selectedIndex === index}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${url}')` }}
                role="img"
                aria-label={`Thumbnail ${index + 1}`}
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
      )}
    </div>
  );
}
