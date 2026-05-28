"use client";

import { useAppSelector } from "@/hooks";

export function SellerShoppingBanner() {
  const { isAuthenticated, actingAs } = useAppSelector((state) => state.auth);
  const user = useAppSelector((state) => state.user.user);

  if (!isAuthenticated || user?.role !== "SELLER" || actingAs !== "BUYER") {
    return null;
  }

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-center text-sm text-on-surface">
      You&apos;re signed in as a seller shopping on the storefront (buyer mode).
    </div>
  );
}
