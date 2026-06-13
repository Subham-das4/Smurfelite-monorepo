import React from "react";

/** Single-step digital checkout — shipping removed (Phase 4.4). */
export const CheckoutStepper: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-primary text-sm font-bold">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">
          1
        </span>
        <span>Payment</span>
      </div>
    </div>
  );
};
