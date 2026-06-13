const DEFAULT_BASE = "https://api-sandbox.nowpayments.io/v1";
const REQUEST_MS = 30_000;

export interface NowPaymentsCreateInvoiceBody {
  price_amount: number;
  price_currency: string;
  ipn_callback_url: string;
  order_id: string;
  order_description: string;
  success_url: string;
  cancel_url: string;
}

export interface NowPaymentsInvoiceResponse {
  id: number | string;
  invoice_url: string;
}

export class NowPaymentsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "NowPaymentsApiError";
  }
}

function getBaseUrl(): string {
  const raw = process.env.NOWPAYMENTS_API_BASE_URL?.trim() || DEFAULT_BASE;
  return raw.replace(/\/$/, "");
}

function getApiKey(): string {
  const key = process.env.NOWPAYMENTS_API_KEY?.trim();
  if (!key) {
    throw new NowPaymentsApiError(
      "NOWPAYMENTS_API_KEY is not configured.",
      500,
    );
  }
  return key;
}

export async function createInvoice(
  body: NowPaymentsCreateInvoiceBody,
): Promise<NowPaymentsInvoiceResponse> {
  const baseUrl = getBaseUrl();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), REQUEST_MS);
  try {
    const res = await fetch(`${baseUrl}/invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getApiKey(),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new NowPaymentsApiError(
        "Invalid JSON from NOWPayments.",
        res.status,
        text,
      );
    }
    if (!res.ok) {
      const msg =
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof (data as { message: unknown }).message === "string"
          ? (data as { message: string }).message
          : `NOWPayments error (${res.status})`;
      throw new NowPaymentsApiError(msg, res.status, data);
    }
    const inv = data as Partial<NowPaymentsInvoiceResponse>;
    if (!inv.invoice_url || inv.id === undefined) {
      throw new NowPaymentsApiError(
        "Unexpected NOWPayments invoice response.",
        502,
        data,
      );
    }
    return {
      id: inv.id,
      invoice_url: inv.invoice_url,
    };
  } catch (e) {
    if (e instanceof NowPaymentsApiError) throw e;
    if (e instanceof Error && e.name === "AbortError") {
      throw new NowPaymentsApiError("NOWPayments request timed out.", 504);
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}
