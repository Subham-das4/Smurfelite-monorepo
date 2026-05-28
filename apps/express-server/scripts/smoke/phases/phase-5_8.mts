import { prisma } from "../../../src/lib/prisma.js";
import { loginUser } from "../../../src/modules/auth/auth.service.js";
import { SmokeRunner } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest, loginAdmin } from "../lib/http.mts";

export async function runPhase5_8(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 5.8 — Auth hardening");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  const admin = await loginAdmin(ctx.apiBase);

  const uniqueEmail = `smoke-5-8-${Date.now()}@test.com`;
  const password = "testpass123";

  runner.section("Registration defaults to BUYER");

  await runner.test("POST /auth/register ignores role escalation in body", async () => {
    const { data } = await apiRequest<{ user: { role: string } }>(
      ctx,
      "/auth/register",
      {
        method: "POST",
        body: {
          email: uniqueEmail,
          password,
          name: "Smoke Auth Hardening",
          role: "ADMIN",
        },
        expectStatus: 201,
      }
    );
    runner.assert(data.user.role === "BUYER", "public register must force BUYER");
  });

  runner.section("lastLoginAt on login");

  await runner.test("loginUser updates lastLoginAt", async () => {
    const before = await prisma.user.findUnique({
      where: { email: uniqueEmail },
      select: { lastLoginAt: true },
    });

    await loginUser(uniqueEmail, password);

    const after = await prisma.user.findUnique({
      where: { email: uniqueEmail },
      select: { lastLoginAt: true },
    });
    runner.assert(after?.lastLoginAt, "lastLoginAt should be set");
    if (before?.lastLoginAt) {
      runner.assert(
        after!.lastLoginAt! >= before.lastLoginAt,
        "lastLoginAt should not go backwards"
      );
    }
  });

  runner.section("Seller onboarding (no promote-seller)");

  await runner.test("PATCH /users/:id/promote-seller is removed", async () => {
    const user = await prisma.user.findUnique({
      where: { email: uniqueEmail },
      select: { id: true },
    });
    runner.assert(user, "registered user missing");

    await apiRequest(ctx, `/users/${user!.id}/promote-seller`, {
      method: "PATCH",
      token: admin.accessToken,
      expectStatus: 404,
    });
  });

  await runner.test("POST /auth/seller/apply upgrades buyer to PENDING seller + wallet", async () => {
    const { data } = await apiRequest<{
      user: { id: string; role: string; sellerApprovalStatus: string };
    }>(ctx, "/auth/seller/apply", {
      method: "POST",
      body: { email: uniqueEmail, password, name: "Smoke Auth Hardening" },
      expectStatus: 200,
    });
    runner.assert(data.user.role === "SELLER", "expected SELLER role");
    runner.assert(
      data.user.sellerApprovalStatus === "PENDING",
      "expected PENDING approval"
    );

    const wallet = await prisma.sellerWallet.findUnique({
      where: { userId: data.user.id },
    });
    runner.assert(wallet, "seller wallet should exist after apply");
  });

  runner.section("Cleanup");

  await runner.test("Remove smoke registration user", async () => {
    const user = await prisma.user.findUnique({
      where: { email: uniqueEmail },
      select: { id: true },
    });
    if (user) {
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.verificationToken.deleteMany({ where: { userId: user.id } });
      await prisma.sellerWallet.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    runner.assert(user, "smoke user existed for cleanup");
  });

  return runner.finishPhase();
}
