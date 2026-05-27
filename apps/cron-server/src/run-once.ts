/**
 * Run all jobs once (local smoke / CI).
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
  const prisma = getPrisma(config);
  await prisma.$queryRaw`SELECT 1`;

  const order = await runOrderExpiryJob(prisma, config, logger);
  const wallet = await runWalletHoldReleaseJob(prisma, config, logger);
  const embedding = await runEmbeddingBackfillJob(prisma, config, logger);

  logger.info("run-once summary", {
    orderExpiry: order.processed,
    walletHoldRelease: wallet.processed,
    embeddingBackfill: embedding.processed,
  });

  await disconnectDb();
  logger.info("run-once complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
