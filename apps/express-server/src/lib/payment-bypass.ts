/** True when PAYMENT_BYPASS env is exactly "true" (dev/E2E only). Never enable in production. */
export function isPaymentBypassEnabled(): boolean {
  return process.env.PAYMENT_BYPASS?.trim().toLowerCase() === "true";
}
