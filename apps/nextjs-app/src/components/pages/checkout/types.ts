/** @deprecated Shipping removed for digital-only checkout (Phase 4.4). Kept for reference. */
export type CheckoutStep = 1;

export type PaymentMethod = "paypal" | "card" | "crypto" | "skrill";

/**
 * @deprecated Client-only fixture — shipping step removed (Phase 4.4, ISS-012).
 * Digital accounts do not require a shipping address.
 */
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
