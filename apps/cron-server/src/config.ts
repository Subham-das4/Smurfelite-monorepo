export type CronConfig = {
  databaseUrl: string;
  logLevel: string;
  walletHoldDays: number;
  walletReleaseCron: string;
  orderPendingTimeoutMinutes: number;
  orderExpiryCron: string;
  embeddingBackfillEnabled: boolean;
  embeddingBatchSize: number;
  embeddingBackfillCron: string;
  embeddingProviderApiKey: string | undefined;
  embeddingModel: string;
  alertWebhookUrl: string | undefined;
  advisoryLockId: number;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function parseIntEnv(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return defaultValue;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) {
    throw new Error(`${name} must be an integer (got "${raw}")`);
  }
  return n;
}

function parseBoolEnv(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return defaultValue;
  return raw === "1" || raw.toLowerCase() === "true";
}

export function loadConfig(): CronConfig {
  return {
    databaseUrl: requireEnv("DATABASE_URL"),
    logLevel: process.env.LOG_LEVEL?.trim() || "info",
    walletHoldDays: parseIntEnv("WALLET_HOLD_DAYS", 7),
    walletReleaseCron:
      process.env.WALLET_RELEASE_CRON?.trim() || "0 * * * *",
    orderPendingTimeoutMinutes: parseIntEnv(
      "ORDER_PENDING_TIMEOUT_MINUTES",
      30
    ),
    orderExpiryCron: process.env.ORDER_EXPIRY_CRON?.trim() || "*/10 * * * *",
    embeddingBackfillEnabled: parseBoolEnv("EMBEDDING_BACKFILL_ENABLED", false),
    embeddingBatchSize: parseIntEnv("EMBEDDING_BATCH_SIZE", 10),
    embeddingBackfillCron:
      process.env.EMBEDDING_BACKFILL_CRON?.trim() || "0 3 * * *",
    embeddingProviderApiKey:
      process.env.EMBEDDING_PROVIDER_API_KEY?.trim() || undefined,
    embeddingModel:
      process.env.EMBEDDING_MODEL?.trim() || "text-embedding-3-small",
    alertWebhookUrl: process.env.CRON_ALERT_WEBHOOK_URL?.trim() || undefined,
    advisoryLockId: parseIntEnv("CRON_ADVISORY_LOCK_ID", 810_000_001),
  };
}
