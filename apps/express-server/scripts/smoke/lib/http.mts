import type { SmokeContext } from "./runner.mts";

export type LoginResult = {
  accessToken: string;
  userId: string;
};

export function getApiBase(): string {
  const port = process.env.PORT?.trim() || "8080";
  return (process.env.SMOKE_API_BASE?.trim() || `http://localhost:${port}/api`).replace(
    /\/$/,
    ""
  );
}

export async function login(
  apiBase: string,
  email: string,
  password: string
): Promise<LoginResult> {
  const res = await fetch(`${apiBase}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Login failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    accessToken?: string;
    user?: { id?: string };
  };

  if (!data.accessToken || !data.user?.id) {
    throw new Error("Login response missing accessToken or user.id");
  }

  return { accessToken: data.accessToken, userId: data.user.id };
}

export async function apiRequest<T = unknown>(
  ctx: Pick<SmokeContext, "apiBase">,
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: unknown;
    expectStatus?: number;
  } = {}
): Promise<{ status: number; data: T }> {
  const { method = "GET", token, body, expectStatus } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${ctx.apiBase}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: T;
  const text = await res.text();
  try {
    data = text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    data = text as T;
  }

  if (expectStatus !== undefined && res.status !== expectStatus) {
    throw new Error(
      `${method} ${path} expected ${expectStatus}, got ${res.status}: ${text}`
    );
  }

  return { status: res.status, data };
}

export async function createBuyerContext(): Promise<SmokeContext> {
  const apiBase = getApiBase();
  const email = process.env.SMOKE_BUYER_EMAIL?.trim() || "buyer@buyer.com";
  const password = process.env.SMOKE_BUYER_PASSWORD?.trim() || "buyer123";
  const { accessToken, userId } = await login(apiBase, email, password);
  return { apiBase, buyerToken: accessToken, buyerId: userId };
}

export async function loginSeller(apiBase: string) {
  const email = process.env.SMOKE_SELLER_EMAIL?.trim() || "seller@seller.com";
  const password = process.env.SMOKE_SELLER_PASSWORD?.trim() || "seller123";
  return login(apiBase, email, password);
}

export async function loginAdmin(apiBase: string) {
  const email = process.env.SMOKE_ADMIN_EMAIL?.trim() || "admin@admin.com";
  const password = process.env.SMOKE_ADMIN_PASSWORD?.trim() || "admin123";
  return login(apiBase, email, password);
}
