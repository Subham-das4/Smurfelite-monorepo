import crypto from "crypto";

/**
 * Recursively sort object keys (NOWPayments IPN verification expects stable JSON).
 */
export function sortKeysRecursive(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortKeysRecursive);
  const record = obj as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(record).sort()) {
    sorted[key] = sortKeysRecursive(record[key]);
  }
  return sorted;
}

export function buildIpnSignPayload(payload: Record<string, unknown>): string {
  const sorted = sortKeysRecursive(payload) as Record<string, unknown>;
  return JSON.stringify(sorted);
}

export function verifyNowPaymentsIpnSignature(
  payload: Record<string, unknown>,
  signatureHeader: string | undefined,
  ipnSecret: string
): boolean {
  if (!signatureHeader || !ipnSecret) return false;
  const signString = buildIpnSignPayload(payload);
  const hmac = crypto.createHmac("sha512", ipnSecret);
  hmac.update(signString);
  const digest = hmac.digest("hex");

  const sig = signatureHeader.trim();
  const digestBuf = Buffer.from(digest, "utf8");
  const sigBuf = Buffer.from(sig, "utf8");
  if (digestBuf.length !== sigBuf.length) return false;
  try {
    return crypto.timingSafeEqual(digestBuf, sigBuf);
  } catch {
    return false;
  }
}
