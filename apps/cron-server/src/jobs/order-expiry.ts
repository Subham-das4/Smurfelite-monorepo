import type { PrismaClient } from "@smurfelite/types/src/generated/prisma/index.js";
import type { Logger } from "winston";
import type { CronConfig } from "../config.js";
import { expireAllStalePendingOrders } from "../lib/order-expiry.js";
import type { JobResult } from "./types.js";

export async function runOrderExpiryJob(
  prisma: PrismaClient,
  config: CronConfig,
  logger: Logger
): Promise<JobResult> {
  const processed = await expireAllStalePendingOrders(
    prisma,
    config.orderPendingTimeoutMinutes,
    logger
  );

  if (processed > 0) {
    logger.info(
      `order-expiry: cancelled ${processed} stale PENDING order(s) (timeout ${config.orderPendingTimeoutMinutes}m)`
    );
  }

  return { job: "order-expiry", processed };
}
