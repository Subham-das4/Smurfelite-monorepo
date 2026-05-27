/**
 * Run all job stubs once (for local smoke / Phase 8.2 dev).
 * Usage: pnpm start:once
 */
import { loadConfig } from "./config.js";
import { getPrisma, disconnectDb } from "./db.js";
import { createLogger } from "./utils/logger.js";
import { runOrderExpiryJob } from "./jobs/order-expiry.js";
import { runWalletHoldReleaseJob } from "./jobs/wallet-hold-release.js";
import { runEmbeddingBackfillJob } from "./jobs/embedding-backfill.js";

const config = loadConfig();
const logger = createLogger(config.logLevel);

async function main() {
  getPrisma(config);
  await runOrderExpiryJob(config, logger);
  await runWalletHoldReleaseJob(config, logger);
  await runEmbeddingBackfillJob(config, logger);
  await disconnectDb();
  logger.info("run-once complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
