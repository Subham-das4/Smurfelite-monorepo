const DEFAULT_ORDER_PENDING_TIMEOUT_MINUTES = 30;

/** Minutes a PENDING order may remain unpaid before auto-cancel (inline or cron). */
export function getOrderPendingTimeoutMinutes(): number {
  const raw = process.env.ORDER_PENDING_TIMEOUT_MINUTES?.trim();
  if (!raw) return DEFAULT_ORDER_PENDING_TIMEOUT_MINUTES;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_ORDER_PENDING_TIMEOUT_MINUTES;
  }
  return parsed;
}

export function getPendingOrderExpiryCutoff(): Date {
  const ms = getOrderPendingTimeoutMinutes() * 60 * 1000;
  return new Date(Date.now() - ms);
}
