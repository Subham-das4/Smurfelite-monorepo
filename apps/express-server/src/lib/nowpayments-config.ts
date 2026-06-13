export function isNowPaymentsEnabled(): boolean {
  return Boolean(
    process.env.NOWPAYMENTS_API_KEY?.trim() &&
      process.env.PUBLIC_API_BASE_URL?.trim() &&
      process.env.NOWPAYMENTS_IPN_SECRET?.trim()
  );
}
