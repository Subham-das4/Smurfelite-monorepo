"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MdShoppingCart, MdCheck } from "react-icons/md";
import { HiArrowRight } from "react-icons/hi";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { setIsLoginModalOpen } from "@/store/reducers/auth/slice";
import { useAddToCartMutation } from "@/api/cart";
import { notifyAddToCartResult } from "@/lib/addToCartFeedback";

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
  id: string;
  title: string;
  gameType: string;
  price: number;
  imageUrl?: string | null;
}

export function ProductPurchaseCard({
  id,
  title,
  gameType,
  price,
  imageUrl,
}: ProductPurchaseCardProps) {
  void imageUrl;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const [added, setAdded] = useState(false);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      dispatch(setIsLoginModalOpen(true));
      return;
    }
    const result = await addToCart(id);
    const outcome = notifyAddToCartResult(result, { productTitle: title });
    if (outcome === "added") {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      dispatch(setIsLoginModalOpen(true));
      return;
    }
    const result = await addToCart(id);
    const outcome = notifyAddToCartResult(result, {
      productTitle: title,
      suppressDuplicateToast: true,
    });
    if (outcome === "added" || outcome === "duplicate") {
      router.push(`/checkout/${id}`);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 flex flex-col gap-6 h-fit sticky top-24">
      {/* Game type + Title */}
      <div className="space-y-3">
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/20">
          {gameType}
        </span>

        <h1 className="text-3xl md:text-4xl font-bold leading-tight text-slate-900">
          {title}
        </h1>
      </div>

      <div className="h-px bg-slate-100 w-full" />

      {/* Price + Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
            ${price.toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={added || isAddingToCart}
            className="col-span-2 h-14 bg-primary hover:bg-primary/90 disabled:bg-primary/70 text-white text-lg font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(127,19,236,0.15)] hover:shadow-[0_0_30px_rgba(127,19,236,0.3)] flex items-center justify-center gap-2"
          >
            {added ? (
              <>
                <MdCheck className="text-xl" />
                Added to Cart!
              </>
            ) : (
              <>
                <MdShoppingCart className="text-xl" />
                {isAuthenticated ? "Add to Cart" : "Login to Buy"}
              </>
            )}
          </button>

          {/* Buy Now */}
          <button
            onClick={handleBuyNow}
            disabled={isAddingToCart}
            className="h-12 border border-slate-200 hover:bg-slate-50 text-slate-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 col-span-2"
          >
            Buy Now
            <HiArrowRight className="text-base" />
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
