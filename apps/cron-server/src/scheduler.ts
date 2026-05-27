import cron from "node-cron";
import type { Logger } from "winston";
import type { PrismaClient } from "@smurfelite/types/src/generated/prisma/index.js";
import type { CronConfig } from "./config.js";
import { withAdvisoryLock, jobLockId } from "./utils/lock.js";
import { sendJobFailureAlert } from "./utils/alert.js";
import { runOrderExpiryJob } from "./jobs/order-expiry.js";
import { runWalletHoldReleaseJob } from "./jobs/wallet-hold-release.js";
import { runEmbeddingBackfillJob } from "./jobs/embedding-backfill.js";
import type { JobResult } from "./jobs/types.js";

const JOB_SLOTS = {
  orderExpiry: 1,
  walletHoldRelease: 2,
  embeddingBackfill: 3,
} as const;

function assertValidCron(expression: string, name: string) {
  if (!cron.validate(expression)) {
    throw new Error(`Invalid cron expression for ${name}: "${expression}"`);
  }
}

async function runGuarded(
  prisma: PrismaClient,
  config: CronConfig,
  logger: Logger,
  jobName: string,
  slot: number,
  run: () => Promise<JobResult>
) {
  const lockId = jobLockId(config.advisoryLockId, slot);

  try {
    const result = await withAdvisoryLock(prisma, lockId, async () => {
      logger.info(`[${jobName}] tick start`, { job: jobName, lockId });
      const out = await run();
      logger.info(`[${jobName}] tick end`, {
        job: jobName,
        processed: out.processed,
        skipped: out.skipped,
        skippedJob: out.skippedJob,
      });
      return out;
    });

    if (result === null) {
      logger.warn(`[${jobName}] skipped — advisory lock ${lockId} held elsewhere`, {
        job: jobName,
        lockId,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`[${jobName}] tick failed: ${message}`, {
      job: jobName,
      stack: err instanceof Error ? err.stack : undefined,
    });
    await sendJobFailureAlert(config, jobName, err);
  }
}

export function registerCronJobs(
  prisma: PrismaClient,
  config: CronConfig,
  logger: Logger
): cron.ScheduledTask[] {
  assertValidCron(config.orderExpiryCron, "ORDER_EXPIRY_CRON");
  assertValidCron(config.walletReleaseCron, "WALLET_RELEASE_CRON");
  assertValidCron(config.embeddingBackfillCron, "EMBEDDING_BACKFILL_CRON");

  const tasks: cron.ScheduledTask[] = [];

  tasks.push(
    cron.schedule(config.orderExpiryCron, () => {
      void runGuarded(prisma, config, logger, "order-expiry", JOB_SLOTS.orderExpiry, () =>
        runOrderExpiryJob(prisma, config, logger)
      );
    })
  );

  tasks.push(
    cron.schedule(config.walletReleaseCron, () => {
      void runGuarded(
        prisma,
        config,
        logger,
        "wallet-hold-release",
        JOB_SLOTS.walletHoldRelease,
        () => runWalletHoldReleaseJob(prisma, config, logger)
      );
    })
  );

  tasks.push(
    cron.schedule(config.embeddingBackfillCron, () => {
      void runGuarded(
        prisma,
        config,
        logger,
        "embedding-backfill",
        JOB_SLOTS.embeddingBackfill,
        () => runEmbeddingBackfillJob(prisma, config, logger)
      );
    })
  );

  return tasks;
}
