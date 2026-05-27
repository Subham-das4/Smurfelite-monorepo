import type { Logger } from "winston";
import type { CronConfig } from "../config.js";

export type JobResult = {
  job: string;
  processed: number;
  skipped?: boolean;
};

/**
 * Cancel stale PENDING orders and release product transaction blocks.
 * Implementation: Phase 8.2 (reuse express order-expiry batch logic).
 */
export async function runOrderExpiryJob(
  _config: CronConfig,
  logger: Logger
): Promise<JobResult> {
  logger.info(
    "order-expiry job registered (implementation pending Phase 8.2)"
  );
  return { job: "order-expiry", processed: 0 };
}
