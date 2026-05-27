import React, { useState } from "react";
import {
  MdArrowBack,
  MdArrowForward,
  MdCreditCard,
  MdAccountBalanceWallet,
  MdInfo,
  MdCurrencyBitcoin,
} from "react-icons/md";
import type { PaymentMethod, ShippingFormData } from "./types";

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

interface ShippingSummaryProps {
  data: ShippingFormData;
  onEdit: () => void;
}

const ShippingSummary: React.FC<ShippingSummaryProps> = ({ data, onEdit }) => (
  <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden text-sm">
    <div className="p-4 flex items-center justify-between border-b border-border-light dark:border-border-dark">
      <div className="flex flex-col gap-1">
        <span className="text-[#756189] dark:text-gray-400 text-xs">
          Contact
        </span>
        <span className="font-medium truncate">{data.email}</span>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-primary hover:text-primary/80 font-medium text-xs transition-colors"
      >
        Change
      </button>
    </div>
    <div className="p-4 flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <span className="text-[#756189] dark:text-gray-400 text-xs">
          Ship to
        </span>
        <span className="font-medium truncate">
          {data.address}
          {data.apartment ? `, ${data.apartment}` : ""}, {data.city},{" "}
          {data.postalCode}
        </span>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-primary hover:text-primary/80 font-medium text-xs transition-colors"
      >
        Change
      </button>
    </div>
  </div>
);

interface PaymentFormProps {
  shippingData: ShippingFormData;
  onBack: () => void;
  onSubmit: (method: PaymentMethod) => void | Promise<void>;
  isSubmitting?: boolean;
  /** When true, Complete Order is disabled (e.g. cart still loading from API). */
  submitDisabled?: boolean;
  /** Dev/E2E: server has PAYMENT_BYPASS enabled — no crypto redirect. */
  paymentBypassEnabled?: boolean;
}

const PAYMENT_OPTIONS: Omit<
  PaymentOptionProps,
  "selected" | "onSelect"
>[] = [
  {
    id: "paypal",
    label: "PayPal",
    description:
      "Pay simply and securely with PayPal. You will be redirected to complete your purchase. Billing address is handled by PayPal.",
    icon: (
      <span className="font-bold italic text-lg select-none">
        <span className="text-[#003087]">Pay</span>
        <span className="text-[#009cde]">Pal</span>
      </span>
    ),
    disabled: true,
    disabledReason: "Coming soon",
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
      "You will be redirected to complete payment in cryptocurrency (sandbox). Confirmation is sent to our servers automatically.",
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
  shippingData,
  onBack,
  onSubmit,
  isSubmitting,
  submitDisabled = false,
  paymentBypassEnabled = false,
}) => {
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod>("crypto");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(selectedMethod);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Shipping summary */}
      <ShippingSummary data={shippingData} onEdit={onBack} />

      {/* Payment method selection */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Payment Method</h2>
        {paymentBypassEnabled && (
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2">
            Test mode: payment bypass is enabled. Your order will complete
            immediately without crypto checkout.
          </p>
        )}
        <p className="text-sm text-[#756189] dark:text-gray-400 mb-6">
          All transactions are secure and encrypted.
        </p>

        <div className="flex flex-col gap-4">
          {PAYMENT_OPTIONS.map((option) => (
            <PaymentOption
              key={option.id}
              {...option}
              selected={selectedMethod === option.id}
              onSelect={setSelectedMethod}
            />
          ))}
        </div>
      </div>

      {/* Billing address note */}
      <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-border-light dark:border-border-dark flex items-start gap-3">
        <MdInfo className="text-[#756189] shrink-0 text-xl mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-[#141118] dark:text-white mb-1">
            Billing Address
          </h4>
          <p className="text-sm text-[#756189] dark:text-gray-400 leading-relaxed">
            Your billing address will be collected and verified securely by the
            selected payment provider on the next step.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border-light dark:border-border-dark">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors py-2"
        >
          <MdArrowBack className="text-lg" />
          Return to shipping
        </button>
        <button
          type="submit"
          disabled={isSubmitting || submitDisabled}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 active:scale-95 text-white rounded-xl h-14 px-8 text-base font-bold tracking-wide shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
        >
          <span>
            {isSubmitting
              ? "Processing…"
              : submitDisabled
                ? "Loading cart…"
                : paymentBypassEnabled
                  ? "Complete Order (test)"
                  : "Complete Order"}
          </span>
          <MdArrowForward className="text-lg" />
        </button>
      </div>
    </form>
  );
};
