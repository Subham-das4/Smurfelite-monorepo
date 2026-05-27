import type { PrismaClient } from "@smurfelite/types/src/generated/prisma/index.js";
import type { Logger } from "winston";
import type { CronConfig } from "../config.js";
import { releaseEligibleWalletHolds } from "../lib/wallet-hold-release.js";
import type { JobResult } from "./types.js";

export async function runWalletHoldReleaseJob(
  prisma: PrismaClient,
  config: CronConfig,
  logger: Logger
): Promise<JobResult> {
  const { processed, skipped } = await releaseEligibleWalletHolds(
    prisma,
    config.walletHoldDays,
    logger
  );

  if (processed > 0 || skipped > 0) {
    logger.info(
      `wallet-hold-release: released ${processed}, skipped ${skipped} (hold ${config.walletHoldDays} days)`
    );
  }

  return { job: "wallet-hold-release", processed, skipped };
}
