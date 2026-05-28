import ApiError from "../utils/errors.js";
import logger from "../utils/logger.js";

export function isPayPalEnabled(): boolean {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID?.trim() &&
      process.env.PAYPAL_CLIENT_SECRET?.trim()
  );
}

export function assertPayPalConfigured(): void {
  if (!isPayPalEnabled()) {
    throw new ApiError("PayPal is not configured on this server.", 503);
  }
}

export function getPayPalSdkEnvironment(): "Production" | "Sandbox" {
  const mode = process.env.PAYPAL_MODE?.trim().toLowerCase() ?? "sandbox";
  return mode === "live" ? "Production" : "Sandbox";
}

export function getPayPalApiBaseUrl(): string {
  return getPayPalSdkEnvironment() === "Production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function getPayPalWebhookId(): string | null {
  return process.env.PAYPAL_WEBHOOK_ID?.trim() || null;
}

export function shouldVerifyPayPalWebhook(): boolean {
  if (process.env.NODE_ENV === "production") {
    return true;
  }
  return (
    process.env.PAYPAL_WEBHOOK_SKIP_VERIFY?.trim().toLowerCase() !== "true"
  );
}

export function requirePayPalWebhookIdForVerification(): string {
  const webhookId = getPayPalWebhookId();
  if (webhookId) {
    return webhookId;
  }

  if (process.env.NODE_ENV === "production") {
    throw new ApiError("PAYPAL_WEBHOOK_ID is not configured.", 500);
  }

  if (shouldVerifyPayPalWebhook()) {
    logger.warn(
      "PAYPAL_WEBHOOK_ID is not set; webhook verification cannot run. Set PAYPAL_WEBHOOK_SKIP_VERIFY=true to allow unverified webhooks in development only."
    );
  }

  return "";
}
