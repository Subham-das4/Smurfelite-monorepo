"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MdArrowForward, MdVerifiedUser } from "react-icons/md";
import { ORDER_SERVICE_FEE_USD } from "@smurfelite/types";

const PAYMENT_BRANDS = ["VISA", "MC", "PP"] as const;

interface OrderSummaryProps {
  subtotal: number;
  itemCount: number;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  subtotal,
  itemCount,
}) => {
  const router = useRouter();
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const handleApplyPromo = () => {
    // TODO: validate promo code via API
    void promoCode;
    setDiscount(0);
  };

  const total = subtotal + ORDER_SERVICE_FEE_USD - discount;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Order Summary
      </h2>

      {/* Line items */}
      <div className="flex flex-col gap-3 pb-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
          <span>
            Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            ${subtotal.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
          <span>Service Fee</span>
          <span className="font-medium text-gray-900 dark:text-white">
            ${ORDER_SERVICE_FEE_USD.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center text-green-600 dark:text-green-400 font-medium">
          <span>Discount</span>
          <span>-${discount.toFixed(2)}</span>
        </div>
      </div>

      {/* Promo code */}
      <div className="flex gap-2">
        <input
          type="text"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white placeholder:text-gray-400"
          placeholder="Promo code"
        />
        <button
          onClick={handleApplyPromo}
          className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
        >
          Apply
        </button>
      </div>

      {/* Total */}
      <div className="flex justify-between items-end pt-2">
        <span className="text-lg font-medium text-gray-500 dark:text-gray-400">
          Total
        </span>
        <span className="text-3xl font-bold text-primary">
          ${total.toFixed(2)}
        </span>
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push("/checkout")}
        className="w-full bg-primary hover:bg-primary/90 active:scale-95 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 group"
      >
        Proceed to Checkout
        <MdArrowForward className="text-xl group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Trust section */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
          Secured by
        </p>

        <div className="flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
          {PAYMENT_BRANDS.map((brand) => (
            <div
              key={brand}
              className="h-6 w-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-300"
            >
              {brand}
            </div>
          ))}
        </div>

        <p className="text-xs text-center text-gray-400 mt-1 flex items-center justify-center gap-1">
          <MdVerifiedUser className="text-sm shrink-0" />
          100% Money Back Guarantee regarding account recovery.
        </p>
      </div>
    </div>
  );
};
