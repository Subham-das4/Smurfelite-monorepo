import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutCancelContent } from "./CheckoutCancelContent";

export const metadata: Metadata = {
  title: "Checkout cancelled — SmurfElite",
  description: "You left the payment page before completing your order.",
};

export default function CheckoutCancelPage() {
  return (
    <main className="flex-1 w-full max-w-[640px] mx-auto px-4 py-16 md:py-24">
      <CheckoutCancelContent />
      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <Link href="/cart" className="text-primary font-medium hover:underline">
          Return to cart
        </Link>
        {" · "}
        <Link href="/orders" className="text-primary font-medium hover:underline">
          My orders
        </Link>
      </p>
    </main>
  );
}
