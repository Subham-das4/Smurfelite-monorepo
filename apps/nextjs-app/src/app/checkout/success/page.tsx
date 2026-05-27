import type { Metadata } from "next";
import { CheckoutSuccessContent } from "./CheckoutSuccessContent";

export const metadata: Metadata = {
  title: "Payment — SmurfElite",
  description: "Your payment is being confirmed.",
};

export default function CheckoutSuccessPage() {
  return (
    <main className="flex-1 w-full max-w-[640px] mx-auto px-4 py-16 md:py-24">
      <CheckoutSuccessContent />
    </main>
  );
}
