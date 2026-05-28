"use client";

import React from "react";
import { MdClose } from "react-icons/md";
import { PayPalCheckoutButtons } from "@/components/pages/checkout/PayPalCheckoutButtons";

interface OrderPayPalModalProps {
  internalOrderId: string;
  paypalOrderId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OrderPayPalModal({
  internalOrderId,
  paypalOrderId,
  open,
  onClose,
  onSuccess,
}: OrderPayPalModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paypal-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1e1829] border border-[#e0dbe6] dark:border-border-dark shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2
            id="paypal-modal-title"
            className="text-lg font-bold text-[#141118] dark:text-white"
          >
            Pay with PayPal
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="size-9 flex items-center justify-center rounded-lg text-[#756189] hover:bg-[#f2f0f4] dark:hover:bg-white/10"
          >
            <MdClose className="text-xl" />
          </button>
        </div>
        <PayPalCheckoutButtons
          internalOrderId={internalOrderId}
          paypalOrderId={paypalOrderId}
          onSuccess={() => {
            onSuccess();
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
