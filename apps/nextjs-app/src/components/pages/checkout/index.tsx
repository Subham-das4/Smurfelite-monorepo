"use client";

import React, { useState } from "react";
import { CheckoutStepper } from "./CheckoutStepper";
import { ShippingForm } from "./ShippingForm";
import { PaymentForm } from "./PaymentForm";
import { CheckoutOrderSummary } from "./CheckoutOrderSummary";
import type { CheckoutStep, PaymentMethod, ShippingFormData } from "./types";

export const CheckoutContent: React.FC = () => {
  const [step, setStep] = useState<CheckoutStep>(1);
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(
    null,
  );

  const handleShippingSubmit = (data: ShippingFormData) => {
    setShippingData(data);
    setStep(2);
  };

  const handlePaymentSubmit = (method: PaymentMethod) => {
    // TODO: integrate with payment/order API
    console.log("Order placed with method:", method, "shipping:", shippingData);
  };

  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-10 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row gap-8 xl:gap-16">
        {/* Left column: Form */}
        <div className="flex-1 flex flex-col gap-8">
          <CheckoutStepper currentStep={step} />

          {step === 1 && (
            <ShippingForm
              defaultValues={shippingData ?? undefined}
              onSubmit={handleShippingSubmit}
            />
          )}

          {step === 2 && shippingData && (
            <PaymentForm
              shippingData={shippingData}
              onBack={() => setStep(1)}
              onSubmit={handlePaymentSubmit}
            />
          )}
        </div>

        {/* Right column: Order summary */}
        <div className="w-full lg:w-[420px] shrink-0">
          <CheckoutOrderSummary />
        </div>
      </div>
    </main>
  );
};
