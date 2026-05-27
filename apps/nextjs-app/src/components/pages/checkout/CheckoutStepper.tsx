import React from "react";
import { MdScience } from "react-icons/md";

interface CheckoutStepperProps {
  paymentBypassEnabled?: boolean;
}

/** Single-step digital checkout — shipping removed (Phase 4.4). */
export const CheckoutStepper: React.FC<CheckoutStepperProps> = ({
  paymentBypassEnabled = false,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-primary text-sm font-bold">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">
          1
        </span>
        <span>Payment</span>
      </div>
      {paymentBypassEnabled && (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200">
          <MdScience className="text-sm" />
          Test mode
        </span>
      )}
    </div>
  );
};
