import type { PrismaClient } from "@smurfelite/types/src/generated/prisma/index.js";
import type { Logger } from "winston";
import type { CronConfig } from "../config.js";
import { backfillProductEmbeddings } from "../embedding/backfill.js";
import type { JobResult } from "./types.js";

export async function runEmbeddingBackfillJob(
  prisma: PrismaClient,
  config: CronConfig,
  logger: Logger
): Promise<JobResult> {
  if (!config.embeddingBackfillEnabled) {
    logger.debug("embedding-backfill disabled (EMBEDDING_BACKFILL_ENABLED=false)");
    return {
      job: "embedding-backfill",
      processed: 0,
      skippedJob: true,
    };
  }

  const result = await backfillProductEmbeddings(prisma, config, logger);

  if (result.skippedJob && result.reason) {
    logger.warn(`embedding-backfill skipped: ${result.reason}`);
    return {
      job: "embedding-backfill",
      processed: 0,
      skippedJob: true,
    };
  }

  if (result.processed > 0) {
    logger.info(`embedding-backfill: updated ${result.processed} product(s)`);
  }

  return {
    job: "embedding-backfill",
    processed: result.processed,
    skippedJob: result.skippedJob,
  };
}
