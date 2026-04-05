export type CheckoutStep = 1 | 2;

export type PaymentMethod = "paypal" | "card" | "crypto" | "skrill";

export interface ShippingFormData {
  email: string;
  newsletter: boolean;
  country: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment?: string;
  city: string;
  postalCode: string;
  phone: string;
}
