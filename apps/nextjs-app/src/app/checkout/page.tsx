import type { Metadata } from "next";
import { CheckoutContent } from "@/components/pages/checkout";

export const metadata: Metadata = {
  title: "Checkout — SmurfElite",
  description: "Complete your purchase securely.",
};

export default function CheckoutPage() {
  return <CheckoutContent />;
}
