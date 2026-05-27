import type { CronConfig } from "../config.js";

export async function sendJobFailureAlert(
  config: CronConfig,
  jobName: string,
  error: unknown
): Promise<void> {
  const url = config.alertWebhookUrl;
  if (!url) return;

  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "smurfelite-cron-server",
        job: jobName,
        message,
        stack,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Alert delivery must not crash the cron process
  }
}
