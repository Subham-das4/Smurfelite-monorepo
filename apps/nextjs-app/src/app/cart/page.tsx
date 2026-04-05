import type { Metadata } from "next";
import { CartContent } from "@/components/pages/cart/CartContent";

export const metadata: Metadata = {
  title: "Cart — SmurfElite",
  description: "Review your selected gaming accounts and proceed to checkout.",
};

export default function CartPage() {
  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-8 py-6 md:py-10">
      <CartContent />
    </main>
  );
}
