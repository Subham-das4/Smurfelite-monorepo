/**
 * Fixed service fee per order (USD), included in Order.totalAmount.
 * Must match `packages/shared-types/pricing.ts` (`ORDER_SERVICE_FEE_USD`).
 * Express uses this file instead of `@smurfelite/types/pricing` (package `exports` + tsx interop).
 */
export const ORDER_SERVICE_FEE_USD = 0;
