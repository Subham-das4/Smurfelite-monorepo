import type { Metadata } from "next";
import { OrderDetailContent } from "@/components/pages/orders/OrderDetailContent";

export const metadata: Metadata = {
  title: "Order Details — SmurfElite",
};

export default function OrderDetailPage() {
  return <OrderDetailContent />;
}
