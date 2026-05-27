import type { Logger } from "winston";
import type { CronConfig } from "../config.js";
import type { JobResult } from "./order-expiry.js";

/**
 * Move seller pending balance to available after WALLET_HOLD_DAYS.
 * Implementation: Phase 8.2.
 */
export async function runWalletHoldReleaseJob(
  config: CronConfig,
  logger: Logger
): Promise<JobResult> {
  logger.info(
    `wallet-hold-release job registered (hold ${config.walletHoldDays} days — Phase 8.2)`
  );
  return { job: "wallet-hold-release", processed: 0 };
}
