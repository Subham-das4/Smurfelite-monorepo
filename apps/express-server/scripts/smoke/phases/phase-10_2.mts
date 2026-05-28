import jwt from "jsonwebtoken";
import { Role } from "../../../src/types/prisma.js";
import { SmokeRunner } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import {
  apiRequest,
  login,
  loginSeller,
  loginWithActingAs,
} from "../lib/http.mts";

function decodeAccessToken(token: string) {
  return jwt.decode(token) as {
    id?: string;
    role?: string;
    actingAs?: string;
  } | null;
}

export async function runPhase10_2(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 10.2 — JWT actingAs & middleware");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  runner.section("Token claims on login");

  await runner.test("Buyer login includes actingAs BUYER", async () => {
    const email = process.env.SMOKE_BUYER_EMAIL?.trim() || "buyer@buyer.com";
    const password = process.env.SMOKE_BUYER_PASSWORD?.trim() || "buyer123";
    const { accessToken } = await login(ctx.apiBase, email, password);
    const claims = decodeAccessToken(accessToken);
    runner.assert(claims?.role === Role.BUYER, "expected BUYER role");
    runner.assert(claims?.actingAs === Role.BUYER, "expected actingAs BUYER");
  });

  await runner.test("Seller login includes actingAs SELLER", async () => {
    const { accessToken } = await loginSeller(ctx.apiBase);
    const claims = decodeAccessToken(accessToken);
    runner.assert(claims?.role === Role.SELLER, "expected SELLER role");
    runner.assert(claims?.actingAs === Role.SELLER, "expected actingAs SELLER");
  });

  runner.section("Portal-scoped route guards");

  await runner.test("Seller token cannot access buyer cart", async () => {
    const { accessToken } = await loginSeller(ctx.apiBase);
    await apiRequest(ctx, "/cart", {
      token: accessToken,
      expectStatus: 403,
    });
  });

  await runner.test("Seller shopping as buyer can access cart", async () => {
    const { accessToken } = await loginWithActingAs(
      ctx.apiBase,
      process.env.SMOKE_SELLER_EMAIL?.trim() || "seller@seller.com",
      process.env.SMOKE_SELLER_PASSWORD?.trim() || "seller123",
      Role.BUYER
    );
    const claims = decodeAccessToken(accessToken);
    runner.assert(claims?.actingAs === Role.BUYER, "expected actingAs BUYER");
    await apiRequest(ctx, "/cart", {
      token: accessToken,
      expectStatus: 200,
    });
  });

  runner.section("Refresh preserves actingAs");

  await runner.test("POST /auth/refresh returns actingAs in body", async () => {
    const email = process.env.SMOKE_BUYER_EMAIL?.trim() || "buyer@buyer.com";
    const password = process.env.SMOKE_BUYER_PASSWORD?.trim() || "buyer123";
    const loginRes = await fetch(`${ctx.apiBase}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    runner.assert(loginRes.ok, "login failed");
    const setCookie = loginRes.headers.get("set-cookie") ?? "";
    const refreshCookie = setCookie
      .split(",")
      .map((c) => c.trim())
      .find((c) => c.startsWith("refreshToken="));
    runner.assert(refreshCookie, "missing refreshToken cookie");

    const refreshRes = await fetch(`${ctx.apiBase}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: refreshCookie!.split(";")[0],
      },
      body: JSON.stringify({}),
    });
    runner.assert(refreshRes.ok, `refresh failed: ${refreshRes.status}`);
    const body = (await refreshRes.json()) as { actingAs?: string; accessToken?: string };
    runner.assert(body.actingAs === Role.BUYER, "refresh should preserve actingAs BUYER");
    runner.assert(body.accessToken, "refresh should return accessToken");
  });

  return runner.finishPhase();
}
