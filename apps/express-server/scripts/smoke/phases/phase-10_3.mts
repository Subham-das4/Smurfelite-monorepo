import jwt from "jsonwebtoken";
import { prisma } from "../../../src/lib/prisma.js";
import {
  PasswordResetPurpose,
  Role,
} from "../../../src/types/prisma.js";
import { SmokeRunner } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import {
  apiRequest,
  decodeAccessTokenClaims,
  login,
  loginBuyerPortal,
  loginSellerPortal,
  loginAdminPortal,
  tryPortalLogin,
} from "../lib/http.mts";

const BUYER_EMAIL = () =>
  process.env.SMOKE_BUYER_EMAIL?.trim() || "buyer@buyer.com";
const BUYER_PASSWORD = () =>
  process.env.SMOKE_BUYER_PASSWORD?.trim() || "buyer123";
const SELLER_EMAIL = () =>
  process.env.SMOKE_SELLER_EMAIL?.trim() || "seller@seller.com";
const SELLER_PASSWORD = () =>
  process.env.SMOKE_SELLER_PASSWORD?.trim() || "seller123";
const ADMIN_EMAIL = () =>
  process.env.SMOKE_ADMIN_EMAIL?.trim() || "admin@admin.com";
const ADMIN_PASSWORD = () =>
  process.env.SMOKE_ADMIN_PASSWORD?.trim() || "admin123";

export async function runPhase10_3(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 10.3 — Portal auth APIs");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  runner.section("Portal login — happy paths");

  await runner.test("POST /auth/buyer/login — buyer seed", async () => {
    const { accessToken, actingAs } = await loginBuyerPortal(
      ctx.apiBase,
      BUYER_EMAIL(),
      BUYER_PASSWORD()
    );
    const claims = decodeAccessTokenClaims(accessToken);
    runner.assert(claims?.role === Role.BUYER, "expected BUYER role");
    runner.assert(actingAs === Role.BUYER, "expected actingAs BUYER");
    await apiRequest(ctx, "/cart", { token: accessToken, expectStatus: 200 });
  });

  await runner.test("POST /auth/buyer/login — seller shopping as buyer", async () => {
    const { accessToken, actingAs } = await loginBuyerPortal(
      ctx.apiBase,
      SELLER_EMAIL(),
      SELLER_PASSWORD()
    );
    const claims = decodeAccessTokenClaims(accessToken);
    runner.assert(claims?.role === Role.SELLER, "expected SELLER role");
    runner.assert(actingAs === Role.BUYER, "expected actingAs BUYER");
    await apiRequest(ctx, "/cart", { token: accessToken, expectStatus: 200 });
  });

  await runner.test("POST /auth/seller/login — seller portal", async () => {
    const { accessToken, actingAs } = await loginSellerPortal(
      ctx.apiBase,
      SELLER_EMAIL(),
      SELLER_PASSWORD()
    );
    runner.assert(actingAs === Role.SELLER, "expected actingAs SELLER");
    await apiRequest(ctx, "/products/mine", {
      token: accessToken,
      expectStatus: 200,
    });
  });

  await runner.test("POST /auth/admin/login — admin", async () => {
    const { accessToken, actingAs } = await loginAdminPortal(
      ctx.apiBase,
      ADMIN_EMAIL(),
      ADMIN_PASSWORD()
    );
    const claims = decodeAccessTokenClaims(accessToken);
    runner.assert(claims?.role === Role.ADMIN, "expected ADMIN role");
    runner.assert(actingAs === undefined, "admin token should omit actingAs");
    await apiRequest(ctx, "/users?page=1&limit=5", {
      token: accessToken,
      expectStatus: 200,
    });
  });

  runner.section("Portal login — rejections (403)");

  await runner.test("Admin email rejected on buyer login", async () => {
    const { status, body } = await tryPortalLogin(
      ctx.apiBase,
      "buyer",
      ADMIN_EMAIL(),
      ADMIN_PASSWORD()
    );
    runner.assert(status === 403, `expected 403, got ${status}`);
    runner.assert(
      JSON.stringify(body).includes("buyer site"),
      "expected buyer portal message"
    );
  });

  await runner.test("Buyer email rejected on seller login", async () => {
    const { status } = await tryPortalLogin(
      ctx.apiBase,
      "seller",
      BUYER_EMAIL(),
      BUYER_PASSWORD()
    );
    runner.assert(status === 403, `expected 403, got ${status}`);
  });

  await runner.test("Seller email rejected on admin login", async () => {
    const { status } = await tryPortalLogin(
      ctx.apiBase,
      "admin",
      SELLER_EMAIL(),
      SELLER_PASSWORD()
    );
    runner.assert(status === 403, `expected 403, got ${status}`);
  });

  await runner.test("Buyer email rejected on admin login", async () => {
    const { status } = await tryPortalLogin(
      ctx.apiBase,
      "admin",
      BUYER_EMAIL(),
      BUYER_PASSWORD()
    );
    runner.assert(status === 403, `expected 403, got ${status}`);
  });

  await runner.test("Wrong password returns 401 on buyer login", async () => {
    const { status } = await tryPortalLogin(
      ctx.apiBase,
      "buyer",
      BUYER_EMAIL(),
      "wrong-password-xyz"
    );
    runner.assert(status === 401, `expected 401, got ${status}`);
  });

  runner.section("Legacy login backward compat");

  await runner.test("POST /auth/login still works for buyer", async () => {
    const res = await fetch(`${ctx.apiBase}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: BUYER_EMAIL(),
        password: BUYER_PASSWORD(),
      }),
    });
    runner.assert(res.ok, `legacy login failed: ${res.status}`);
    runner.assert(res.headers.get("deprecation") === "true", "Deprecation header");
    const data = (await res.json()) as { actingAs?: string };
    runner.assert(data.actingAs === Role.BUYER, "legacy buyer actingAs");
  });

  runner.section("Buyer password reset isolation");

  await runner.test("POST /auth/buyer/forgot-password — buyer token purpose BUYER", async () => {
    await apiRequest(ctx, "/auth/buyer/forgot-password", {
      method: "POST",
      body: { email: BUYER_EMAIL() },
      expectStatus: 200,
    });
    const user = await prisma.user.findUnique({
      where: { email: BUYER_EMAIL() },
      include: { passwordResetToken: true },
    });
    runner.assert(
      user?.passwordResetToken?.purpose === PasswordResetPurpose.BUYER,
      "expected BUYER purpose token"
    );
  });

  await runner.test("Buyer forgot-password ignores admin email", async () => {
    const adminBefore = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL() },
      include: { passwordResetToken: true },
    });
    const tokenBefore = adminBefore?.passwordResetToken?.token;

    await apiRequest(ctx, "/auth/admin/forgot-password", {
      method: "POST",
      body: { email: ADMIN_EMAIL() },
      expectStatus: 200,
    });

    await apiRequest(ctx, "/auth/buyer/forgot-password", {
      method: "POST",
      body: { email: ADMIN_EMAIL() },
      expectStatus: 200,
    });

    const adminAfter = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL() },
      include: { passwordResetToken: true },
    });
    runner.assert(
      adminAfter?.passwordResetToken?.purpose === PasswordResetPurpose.ADMIN,
      "admin token should stay ADMIN purpose after buyer forgot attempt"
    );
    if (tokenBefore) {
      runner.assert(
        adminAfter?.passwordResetToken?.token !== undefined,
        "admin should still have a reset token"
      );
    }
  });

  await runner.test("Buyer reset-password rejects ADMIN-purpose token", async () => {
    const admin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL() },
      include: { passwordResetToken: true },
    });
    runner.assert(admin?.passwordResetToken?.token, "admin reset token required");

    await apiRequest(ctx, "/auth/buyer/reset-password", {
      method: "POST",
      body: {
        token: admin!.passwordResetToken!.token,
        newPassword: "ShouldNotWork123!",
      },
      expectStatus: 400,
    });
  });

  runner.section("Admin password reset isolation");

  await runner.test("POST /auth/admin/forgot-password — ADMIN purpose", async () => {
    await apiRequest(ctx, "/auth/admin/forgot-password", {
      method: "POST",
      body: { email: ADMIN_EMAIL() },
      expectStatus: 200,
    });
    const admin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL() },
      include: { passwordResetToken: true },
    });
    runner.assert(
      admin?.passwordResetToken?.purpose === PasswordResetPurpose.ADMIN,
      "expected ADMIN purpose"
    );
  });

  await runner.test("Admin forgot-password ignores buyer email", async () => {
    await apiRequest(ctx, "/auth/buyer/forgot-password", {
      method: "POST",
      body: { email: BUYER_EMAIL() },
      expectStatus: 200,
    });
    const buyer = await prisma.user.findUnique({
      where: { email: BUYER_EMAIL() },
      include: { passwordResetToken: true },
    });
    runner.assert(
      buyer?.passwordResetToken?.purpose === PasswordResetPurpose.BUYER,
      "buyer token should remain BUYER after admin forgot on buyer email"
    );
  });

  await runner.test("Admin reset-password rejects BUYER-purpose token", async () => {
    const buyer = await prisma.user.findUnique({
      where: { email: BUYER_EMAIL() },
      include: { passwordResetToken: true },
    });
    runner.assert(buyer?.passwordResetToken?.token, "buyer reset token required");

    await apiRequest(ctx, "/auth/admin/reset-password", {
      method: "POST",
      body: {
        token: buyer!.passwordResetToken!.token,
        newPassword: "ShouldNotWork123!",
      },
      expectStatus: 400,
    });
  });

  runner.section("Register hardening");

  await runner.test("POST /auth/register rejects admin@admin.com email", async () => {
    await apiRequest(ctx, "/auth/register", {
      method: "POST",
      body: {
        email: ADMIN_EMAIL(),
        password: "testpass123",
        name: "Smoke Admin Block",
      },
      expectStatus: 409,
    });
  });

  runner.section("Cross-portal token regression");

  await runner.test("Seller portal token blocked on cart", async () => {
    const { accessToken } = await loginSellerPortal(
      ctx.apiBase,
      SELLER_EMAIL(),
      SELLER_PASSWORD()
    );
    await apiRequest(ctx, "/cart", { token: accessToken, expectStatus: 403 });
  });

  return runner.finishPhase();
}
