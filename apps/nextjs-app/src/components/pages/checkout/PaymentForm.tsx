import React, { useState } from "react";
import Link from "next/link";
import {
  MdArrowBack,
  MdArrowForward,
  MdCreditCard,
  MdAccountBalanceWallet,
  MdInfo,
  MdCurrencyBitcoin,
} from "react-icons/md";
import type { PaymentMethod } from "./types";

interface PaymentOptionProps {
  id: PaymentMethod;
  label: string;
  description?: string;
  icon: React.ReactNode;
  badge?: string;
  selected: boolean;
  onSelect: (id: PaymentMethod) => void;
  disabled?: boolean;
  disabledReason?: string;
}

const PaymentOption: React.FC<PaymentOptionProps> = ({
  id,
  label,
  description,
  icon,
  badge,
  selected,
  onSelect,
  disabled,
  disabledReason,
}) => (
  <div
    className={`relative rounded-xl border-2 p-5 transition-all ${
      disabled
        ? "opacity-50 cursor-not-allowed border-border-light dark:border-border-dark bg-gray-50 dark:bg-white/5"
        : `cursor-pointer ${
            selected
              ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
              : "border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:border-primary/50"
          }`
    }`}
    onClick={() => !disabled && onSelect(id)}
  >
    <div className="flex items-start gap-4">
      <input
        type="radio"
        id={id}
        name="payment_method"
        checked={selected}
        disabled={disabled}
        onChange={() => !disabled && onSelect(id)}
        className="mt-1 w-5 h-5 text-primary border-gray-300 focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
      />
      <div className="flex-1">
        <label
          className="flex items-center justify-between cursor-pointer"
          htmlFor={id}
        >
          <span
            className={`font-bold text-lg ${
              selected ? "text-primary" : "text-[#141118] dark:text-white"
            }`}
          >
            {label}
          </span>
          <div className="flex items-center gap-2 text-[#756189]">{icon}</div>
        </label>
        {(badge || disabledReason) && (
          <p className="text-xs font-bold tracking-wider text-[#756189] mt-1 hidden sm:block">
            {disabled ? disabledReason ?? badge : badge}
          </p>
        )}
        {description && selected && (
          <p className="mt-2 text-sm text-[#756189] dark:text-gray-300 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  </div>
);

interface PaymentFormProps {
  onSubmit: (method: PaymentMethod) => void | Promise<void>;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  submitDisabledReason?: string;
  paymentBypassEnabled?: boolean;
  paypalEnabled?: boolean;
  selectedMethod?: PaymentMethod;
  onMethodChange?: (method: PaymentMethod) => void;
  hideSubmit?: boolean;
}

const PAYMENT_OPTIONS: Omit<
  PaymentOptionProps,
  "selected" | "onSelect"
>[] = [
  {
    id: "paypal",
    label: "PayPal",
    description:
      "Pay simply and securely with PayPal. You will be redirected to complete your purchase.",
    icon: (
      <span className="font-bold italic text-lg select-none">
        <span className="text-[#003087]">Pay</span>
        <span className="text-[#009cde]">Pal</span>
      </span>
    ),
  },
  {
    id: "card",
    label: "Credit or Debit Card",
    icon: <MdCreditCard className="text-2xl" />,
    badge: "VISA · MC · AMEX",
    disabled: true,
    disabledReason: "Coming soon",
  },
  {
    id: "crypto",
    label: "Cryptocurrency",
    description:
      "You will be redirected to complete payment in cryptocurrency. Confirmation is sent to our servers automatically.",
    icon: <MdCurrencyBitcoin className="text-2xl" />,
    badge: "BTC · ETH · USDT",
  },
  {
    id: "skrill",
    label: "Skrill / Neteller",
    icon: <MdAccountBalanceWallet className="text-2xl" />,
    disabled: true,
    disabledReason: "Coming soon",
  },
];

export const PaymentForm: React.FC<PaymentFormProps> = ({
  onSubmit,
  isSubmitting,
  submitDisabled = false,
  submitDisabledReason,
  paymentBypassEnabled = false,
  paypalEnabled = false,
  selectedMethod: controlledMethod,
  onMethodChange,
  hideSubmit = false,
}) => {
  const [internalMethod, setInternalMethod] = useState<PaymentMethod>(
    paypalEnabled ? "paypal" : "crypto"
  );
  const selectedMethod = controlledMethod ?? internalMethod;
  const setSelectedMethod = (method: PaymentMethod) => {
    if (onMethodChange) onMethodChange(method);
    else setInternalMethod(method);
  };

  const paymentOptions = PAYMENT_OPTIONS.map((option) => {
    if (option.id === "paypal") {
      return {
        ...option,
        disabled: !paypalEnabled,
        disabledReason: paypalEnabled ? undefined : "Coming soon",
      };
    }
    return option;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(selectedMethod);
  };

  const submitLabel = isSubmitting
    ? "Processing…"
    : submitDisabled
      ? (submitDisabledReason ?? "Cannot complete order")
      : paymentBypassEnabled
        ? "Complete Order (test)"
        : "Complete Order";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Payment</h2>
        <p className="text-sm text-[#756189] dark:text-gray-400 mb-4">
          Digital delivery — account credentials are sent to your email after
          payment. No shipping required.
        </p>
        {paymentBypassEnabled && (
          <div
            className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 px-4 py-3"
            role="status"
          >
            <p className="font-bold uppercase tracking-wide text-xs mb-1">
              Test mode active
            </p>
            <p>
              Payment bypass is enabled on the server. Your order will complete
              immediately without crypto checkout.
            </p>
          </div>
        )}
        <p className="text-sm text-[#756189] dark:text-gray-400 mb-6">
          All transactions are secure and encrypted.
        </p>

        <div className="flex flex-col gap-4">
          {paymentOptions.map((option) => (
            <PaymentOption
              key={option.id}
              {...option}
              selected={selectedMethod === option.id}
              onSelect={setSelectedMethod}
            />
          ))}
        </div>
      </div>

      <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-border-light dark:border-border-dark flex items-start gap-3">
        <MdInfo className="text-[#756189] shrink-0 text-xl mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-[#141118] dark:text-white mb-1">
            Instant delivery
          </h4>
          <p className="text-sm text-[#756189] dark:text-gray-400 leading-relaxed">
            Credentials are delivered by email and in your order history once
            payment is confirmed.
          </p>
        </div>
      </div>

      {!hideSubmit && (
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border-light dark:border-border-dark">
          <Link
            href="/cart"
            className="flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors py-2"
          >
            <MdArrowBack className="text-lg" />
            Back to cart
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || submitDisabled}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 active:scale-95 text-white rounded-xl h-14 px-8 text-base font-bold tracking-wide shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
          >
            <span>{submitLabel}</span>
            <MdArrowForward className="text-lg" />
          </button>
        </div>
      )}
    </form>
  );
};
