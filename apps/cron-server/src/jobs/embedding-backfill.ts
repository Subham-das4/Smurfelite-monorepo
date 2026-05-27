import type { Logger } from "winston";
import type { CronConfig } from "../config.js";
import type { JobResult } from "./order-expiry.js";

/**
 * Backfill product embeddings for pgvector similar search.
 * Implementation: Phase 8.2 (optional; disabled unless EMBEDDING_BACKFILL_ENABLED).
 */
export async function runEmbeddingBackfillJob(
  config: CronConfig,
  logger: Logger
): Promise<JobResult> {
  if (!config.embeddingBackfillEnabled) {
    logger.debug("embedding-backfill disabled (EMBEDDING_BACKFILL_ENABLED=false)");
    return { job: "embedding-backfill", processed: 0, skipped: true };
  }
  logger.info("embedding-backfill job registered (implementation pending Phase 8.2)");
  return { job: "embedding-backfill", processed: 0 };
}
