import React from "react";
import Link from "next/link";
import { MdShoppingCartCheckout } from "react-icons/md";
import { HiArrowLeft } from "react-icons/hi";

export const EmptyCart: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
      <div className="relative flex items-center justify-center size-32">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
        <MdShoppingCartCheckout className="relative text-7xl text-gray-300 dark:text-gray-700" />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Your cart is empty
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Looks like you haven&apos;t added any accounts yet.
        </p>
      </div>

      <Link
        href="/products"
        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary/20"
      >
        <HiArrowLeft className="text-lg" />
        Browse Accounts
      </Link>
    </div>
  );
};
