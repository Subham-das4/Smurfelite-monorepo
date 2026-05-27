import cron from "node-cron";
import type { Logger } from "winston";
import type { PrismaClient } from "@smurfelite/types/src/generated/prisma/index.js";
import type { CronConfig } from "./config.js";
import { withAdvisoryLock, jobLockId } from "./utils/lock.js";
import { runOrderExpiryJob } from "./jobs/order-expiry.js";
import { runWalletHoldReleaseJob } from "./jobs/wallet-hold-release.js";
import { runEmbeddingBackfillJob } from "./jobs/embedding-backfill.js";

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
  run: () => Promise<{ processed: number; skipped?: boolean }>
) {
  const lockId = jobLockId(config.advisoryLockId, slot);
  const result = await withAdvisoryLock(prisma, lockId, async () => {
    logger.info(`[${jobName}] tick start`);
    const out = await run();
    logger.info(
      `[${jobName}] tick end processed=${out.processed}${
        out.skipped ? " (skipped)" : ""
      }`
    );
    return out;
  });

  if (result === null) {
    logger.warn(`[${jobName}] skipped — another instance holds advisory lock ${lockId}`);
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
        runOrderExpiryJob(config, logger)
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
        () => runWalletHoldReleaseJob(config, logger)
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
        () => runEmbeddingBackfillJob(config, logger)
      );
    })
  );

  return tasks;
}
