"use client";

import React from "react";
import Link from "next/link";
import { HiArrowLeft } from "react-icons/hi";
import { useAppSelector } from "@/hooks";
import { CartItem } from "./CartItem";
import { OrderSummary } from "./OrderSummary";
import { EmptyCart } from "./EmptyCart";
import { useGetCartQuery } from "@/api";

export const CartContent: React.FC = () => {
  const { items, totalAmount, totalQuantity } = useAppSelector(
    (state) => state.cart,
  );
  useGetCartQuery();

  const cartItems = Object.values(items);

  if (cartItems.length === 0) {
    return <EmptyCart />;
  }

  return (
    <>
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-gray-900 dark:text-white">
          Your Cart
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          You have {totalQuantity} item{totalQuantity !== 1 ? "s" : ""} in your
          cart ready for checkout.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Cart items — left column */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Column labels (desktop only) */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-4 pb-2 text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
            <div className="col-span-6">Product</div>
            <div className="col-span-3 text-center">Platform / Server</div>
            <div className="col-span-3 text-right">Price</div>
          </div>

          {cartItems.map((item) => (
            <CartItem key={item.productId} item={item} />
          ))}

          {/* Continue shopping */}
          <div className="mt-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-bold transition-colors"
            >
              <HiArrowLeft className="text-xl" />
              Browse more accounts
            </Link>
          </div>
        </div>

        {/* Order summary — right sticky column */}
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <OrderSummary subtotal={totalAmount} itemCount={totalQuantity} />
        </div>
      </div>
    </>
  );
};
