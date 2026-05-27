import type { Metadata } from "next";
import { OrdersContent } from "@/components/pages/orders/OrdersContent";

export const metadata: Metadata = {
  title: "Order History — SmurfElite",
  description:
    "View and manage your past game account purchases on SmurfElite.",
};

export default function OrdersPage() {
  return <OrdersContent />;
}
