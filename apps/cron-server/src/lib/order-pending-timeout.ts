/** Mirrors express-server order-pending-timeout (keep ORDER_PENDING_TIMEOUT_MINUTES in sync). */
export function getOrderPendingTimeoutMinutes(
  configuredMinutes: number
): number {
  if (!Number.isFinite(configuredMinutes) || configuredMinutes < 1) {
    return 30;
  }
  return configuredMinutes;
}

export function getPendingOrderExpiryCutoff(configuredMinutes: number): Date {
  const minutes = getOrderPendingTimeoutMinutes(configuredMinutes);
  return new Date(Date.now() - minutes * 60 * 1000);
}
