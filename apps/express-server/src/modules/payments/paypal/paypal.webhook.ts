import type { Request, Response, NextFunction } from "express";
import logger from "../../../utils/logger.js";
import {
  processPayPalWebhook,
  verifyPayPalWebhook,
} from "./paypal.service.js";

/**
 * Raw-body webhook handler — mount before express.json() in index.ts.
 */
export async function handlePayPalWebhookRaw(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawBody =
      req.body instanceof Buffer
        ? req.body.toString("utf8")
        : typeof req.body === "string"
          ? req.body
          : "";

    if (!rawBody) {
      res.status(400).json({ message: "Empty webhook body." });
      return;
    }

    const isValid = await verifyPayPalWebhook(
      req.headers as Record<string, string | string[] | undefined>,
      rawBody
    );

    if (!isValid) {
      logger.warn("PayPal webhook signature verification failed.");
      res.status(400).json({ message: "Invalid webhook signature." });
      return;
    }

    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    await processPayPalWebhook(payload);

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
}
