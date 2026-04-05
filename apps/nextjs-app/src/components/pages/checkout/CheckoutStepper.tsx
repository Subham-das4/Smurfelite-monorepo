import React from "react";
import { MdCheck } from "react-icons/md";
import type { CheckoutStep } from "./types";

interface Step {
  id: CheckoutStep;
  label: string;
}

const STEPS: Step[] = [
  { id: 1, label: "Shipping" },
  { id: 2, label: "Payment" },
];

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
}

export const CheckoutStepper: React.FC<CheckoutStepperProps> = ({
  currentStep,
}) => {
  return (
    <div className="flex items-center gap-4 text-sm font-medium">
      {STEPS.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;

        return (
          <React.Fragment key={step.id}>
            <div
              className={`flex items-center gap-2 ${
                isActive || isCompleted
                  ? "text-primary"
                  : "text-[#756189] dark:text-gray-400"
              }`}
            >
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs transition-all ${
                  isCompleted
                    ? "bg-primary/10 border border-primary/20 text-primary"
                    : isActive
                      ? "bg-primary text-white"
                      : "border border-[#756189] dark:border-gray-500"
                }`}
              >
                {isCompleted ? (
                  <MdCheck className="text-sm" />
                ) : (
                  step.id
                )}
              </span>
              <span className={isActive ? "" : "hidden sm:inline"}>
                {step.label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={`h-[1px] w-8 transition-colors ${
                  currentStep > step.id
                    ? "bg-primary"
                    : "bg-border-light dark:bg-border-dark"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
