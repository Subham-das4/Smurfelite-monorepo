import * as PayPalSdk from "@paypal/paypal-server-sdk";
import {
  assertPayPalConfigured,
  getPayPalSdkEnvironment,
} from "../../../lib/paypal-config.js";

let cachedClient: PayPalSdk.Client | null = null;

function toSdkEnvironment(mode: "Production" | "Sandbox"): PayPalSdk.Environment {
  return mode === "Production"
    ? PayPalSdk.Environment.Production
    : PayPalSdk.Environment.Sandbox;
}

export function getPayPalClient(): PayPalSdk.Client {
  assertPayPalConfigured();
  if (!cachedClient) {
    cachedClient = new PayPalSdk.Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: process.env.PAYPAL_CLIENT_ID!.trim(),
        oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET!.trim(),
      },
      environment: toSdkEnvironment(getPayPalSdkEnvironment()),
    });
  }
  return cachedClient;
}
