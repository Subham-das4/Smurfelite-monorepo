import type { Metadata } from "next";
import { CheckoutContent } from "@/components/pages/checkout";

type PageProps = {
  params: Promise<{ productId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  await params;
  return {
    title: "Checkout — SmurfElite",
    description: "Complete your purchase securely.",
  };
}

export default async function CheckoutProductPage({ params }: PageProps) {
  const { productId } = await params;
  return <CheckoutContent productIds={[productId]} />;
}
