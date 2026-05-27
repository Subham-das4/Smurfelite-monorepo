"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MdHelp, MdLock, MdVerifiedUser } from "react-icons/md";
import { useAppSelector } from "@/hooks";
import type { CartItemResponse } from "@smurfelite/types";
import { ORDER_SERVICE_FEE_USD } from "@smurfelite/types";

function subtotalFromLineItems(items: CartItemResponse[]): number {
  return items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
}

export type CheckoutOrderSummaryProps = {
  /** When set, summary uses these lines instead of Redux cart. */
  lineItems?: CartItemResponse[];
};

export const CheckoutOrderSummary: React.FC<CheckoutOrderSummaryProps> = ({
  lineItems: lineItemsProp,
}) => {
  const { items, totalAmount } = useAppSelector((state) => state.cart);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const cartItems =
    lineItemsProp ?? Object.values(items);
  const subtotal = lineItemsProp
    ? subtotalFromLineItems(lineItemsProp)
    : totalAmount;
  const total = subtotal + ORDER_SERVICE_FEE_USD - discount;

  const handleApplyPromo = () => {
    // TODO: validate promo code via API
    void promoCode;
    setDiscount(0);
  };

  return (
    <div className="sticky top-24">
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
        {/* Product list */}
        <div className="p-6 border-b border-border-light dark:border-border-dark bg-primary/5">
          <h3 className="text-lg font-bold mb-4">Order Summary</h3>
          {cartItems.length === 0 ? (
            <p className="text-sm text-[#756189] dark:text-gray-400">
              No items in this order.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {cartItems.map((item) => (
                <div key={item.productId} className="flex gap-4">
                  <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-border-light dark:border-border-dark">
                    <Image
                      src={item.product.imageUrl ?? ""}
                      alt={item.product.title}
                      fill
                      className="object-cover"
                    />
                    {item.product.gameType && (
                      <div className="absolute bottom-0 right-0 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tl-md">
                        {item.product.gameType}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <h4 className="font-bold text-base leading-tight truncate">
                      {item.product.title}
                    </h4>
                    <div className="flex gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        Instant Delivery
                      </span>
                    </div>
                  </div>
                  <div className="font-bold text-lg shrink-0">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Promo code */}
        <div className="p-6 border-b border-border-light dark:border-border-dark">
          <div className="flex gap-3">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="form-input flex-1 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark h-11 px-3 text-sm placeholder-[#756189] focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Gift card or discount code"
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              className="bg-[#e0dbe6] dark:bg-[#3b2d4a] hover:bg-gray-300 dark:hover:bg-gray-600 text-[#141118] dark:text-white rounded-lg h-11 px-4 text-sm font-bold transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="p-6 flex flex-col gap-3">
          <div className="flex justify-between text-sm text-[#756189] dark:text-gray-400">
            <span>Subtotal</span>
            <span className="text-[#141118] dark:text-white font-medium">
              ${subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm text-[#756189] dark:text-gray-400">
            <span className="flex items-center gap-1">
              Service Fee
              <MdHelp
                className="text-base cursor-help"
                title="Platform security fee"
              />
            </span>
            <span className="text-[#141118] dark:text-white font-medium">
              ${ORDER_SERVICE_FEE_USD.toFixed(2)}
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-medium">
              <span>Discount</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="h-px bg-border-light dark:bg-border-dark my-2" />
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">Total</span>
            <div className="flex items-end gap-2">
              <span className="text-sm text-[#756189] dark:text-gray-400 mb-1">
                USD
              </span>
              <span className="text-2xl font-bold tracking-tight text-primary">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-center">
          <MdLock className="text-2xl text-primary mb-1" />
          <span className="text-xs font-bold">Secure Checkout</span>
          <span className="text-[10px] text-[#756189] dark:text-gray-400">
            256-bit SSL Encrypted
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-center">
          <MdVerifiedUser className="text-2xl text-primary mb-1" />
          <span className="text-xs font-bold">Money Back</span>
          <span className="text-[10px] text-[#756189] dark:text-gray-400">
            7-Day Guarantee
          </span>
        </div>
      </div>
    </div>
  );
};
