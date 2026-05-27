import { loadConfig } from "./config.js";
import { getPrisma, disconnectDb } from "./db.js";
import { createLogger } from "./utils/logger.js";
import { registerCronJobs } from "./scheduler.js";

const config = loadConfig();
const logger = createLogger(config.logLevel);

async function main() {
  logger.info("SmurfElite cron-server starting");
  logger.info(
    `Schedules: order-expiry="${config.orderExpiryCron}" wallet-release="${config.walletReleaseCron}" embedding="${config.embeddingBackfillCron}"`
  );
  logger.info(
    `Config: holdDays=${config.walletHoldDays} orderTimeoutMin=${config.orderPendingTimeoutMinutes}`
  );

  const prisma = getPrisma(config);
  await prisma.$queryRaw`SELECT 1`;
  logger.info("Database connection OK");

  registerCronJobs(prisma, config, logger);
  logger.info("Cron jobs registered (order-expiry, wallet-hold-release, embedding-backfill)");

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down`);
    await disconnectDb();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
