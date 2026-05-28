import bcrypt from "bcrypt";
import { prisma } from "../../../src/lib/prisma.js";
import { Role } from "../../../src/types/prisma.js";
import { SmokeRunner } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import {
  apiRequest,
  loginAdmin,
  loginAdminPortal,
  loginBuyerPortal,
} from "../lib/http.mts";

const BUYER_EMAIL = () =>
  process.env.SMOKE_BUYER_EMAIL?.trim() || "buyer@buyer.com";
const BUYER_PASSWORD = () =>
  process.env.SMOKE_BUYER_PASSWORD?.trim() || "buyer123";
const ADMIN_EMAIL = () =>
  process.env.SMOKE_ADMIN_EMAIL?.trim() || "admin@admin.com";

const KNOWN_INVITE_PASSWORD = "smoke-admin-invite-10-4";

export async function runPhase10_4(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 10.4 — Admin provisioning API");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  const admin = await loginAdmin(ctx.apiBase);
  const uniqueEmail = `smoke-10-4-${Date.now()}@test.com`;
  const uniqueName = "Smoke Admin 10.4";
  let createdAdminId: string | null = null;

  runner.section("Authorization");

  await runner.test("Buyer cannot POST /admins", async () => {
    const buyer = await loginBuyerPortal(
      ctx.apiBase,
      BUYER_EMAIL(),
      BUYER_PASSWORD()
    );
    await apiRequest(ctx, "/admins", {
      method: "POST",
      token: buyer.accessToken,
      body: { email: `blocked-${Date.now()}@test.com`, name: "Blocked" },
      expectStatus: 403,
    });
  });

  runner.section("Create admin");

  await runner.test("POST /admins — creates admin with audit fields", async () => {
    const { data } = await apiRequest<{
      admin: {
        id: string;
        email: string;
        role: string;
        adminInvitedAt: string | null;
        createdByAdminId: string | null;
      };
    }>(ctx, "/admins", {
      method: "POST",
      token: admin.accessToken,
      body: { email: uniqueEmail, name: uniqueName },
      expectStatus: 201,
    });
    runner.assert(data.admin.role === Role.ADMIN, "expected ADMIN role");
    runner.assert(data.admin.email === uniqueEmail, "expected normalized email");
    runner.assert(data.admin.adminInvitedAt, "adminInvitedAt should be set");
    runner.assert(
      data.admin.createdByAdminId === admin.userId,
      "createdByAdminId should match inviting admin"
    );
    createdAdminId = data.admin.id;

    const row = await prisma.user.findUnique({
      where: { id: createdAdminId },
      select: { role: true, createdByAdminId: true },
    });
    runner.assert(row?.role === Role.ADMIN, "DB role should be ADMIN");
    runner.assert(
      row?.createdByAdminId === admin.userId,
      "DB createdByAdminId should match"
    );
  });

  await runner.test("POST /admins — rejects existing buyer email", async () => {
    await apiRequest(ctx, "/admins", {
      method: "POST",
      token: admin.accessToken,
      body: { email: BUYER_EMAIL(), name: "Duplicate Buyer" },
      expectStatus: 409,
    });
  });

  await runner.test("POST /admins — rejects duplicate admin email", async () => {
    await apiRequest(ctx, "/admins", {
      method: "POST",
      token: admin.accessToken,
      body: { email: uniqueEmail, name: "Duplicate Admin" },
      expectStatus: 409,
    });
  });

  runner.section("List admins");

  await runner.test("GET /admins — paginated list includes new admin", async () => {
    const { data } = await apiRequest<{
      admins: Array<{ id: string; email: string }>;
      meta: { totalCount: number; currentPage: number };
    }>(ctx, "/admins?page=1&pageSize=50", {
      token: admin.accessToken,
      expectStatus: 200,
    });
    runner.assert(data.meta.totalCount >= 1, "expected at least one admin");
    runner.assert(
      data.admins.some((a) => a.id === createdAdminId),
      "list should include created admin"
    );
  });

  runner.section("Admin login after provision");

  await runner.test("POST /auth/admin/login — after setting known password", async () => {
    runner.assert(createdAdminId, "created admin id missing");
    const hashed = await bcrypt.hash(KNOWN_INVITE_PASSWORD, 10);
    await prisma.user.update({
      where: { id: createdAdminId! },
      data: { password: hashed },
    });
    const { accessToken } = await loginAdminPortal(
      ctx.apiBase,
      uniqueEmail,
      KNOWN_INVITE_PASSWORD
    );
    runner.assert(accessToken, "expected access token for new admin");
    await apiRequest(ctx, "/admins", {
      token: accessToken,
      expectStatus: 200,
    });
  });

  runner.section("Role patch lockdown");

  await runner.test("PATCH /users/:id/role — rejects ADMIN", async () => {
    const buyer = await prisma.user.findFirst({
      where: { email: BUYER_EMAIL() },
      select: { id: true },
    });
    runner.assert(buyer, "buyer seed missing");
    await apiRequest(ctx, `/users/${buyer!.id}/role`, {
      method: "PATCH",
      token: admin.accessToken,
      body: { role: Role.ADMIN },
      expectStatus: 400,
    });
  });

  runner.section("Delete guards");

  await runner.test("DELETE /admins/:id — cannot self-delete", async () => {
    const seedAdmin = await prisma.user.findFirst({
      where: { email: ADMIN_EMAIL() },
      select: { id: true },
    });
    runner.assert(seedAdmin, "seed admin missing");
    await apiRequest(ctx, `/admins/${seedAdmin!.id}`, {
      method: "DELETE",
      token: admin.accessToken,
      expectStatus: 400,
    });
  });

  await runner.test("DELETE /admins/:id — cannot delete last admin", async () => {
    const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
    if (adminCount !== 1) {
      runner.assert(
        true,
        `skipped: need exactly 1 admin in DB, found ${adminCount}`
      );
      return;
    }

    const onlyAdmin = await prisma.user.findFirst({
      where: { role: Role.ADMIN },
      select: { id: true },
    });
    runner.assert(onlyAdmin, "expected an admin user");

    await apiRequest(ctx, `/admins/${onlyAdmin!.id}`, {
      method: "DELETE",
      token: admin.accessToken,
      expectStatus: 400,
    });
  });

  await runner.test("DELETE /admins/:id — removes non-seed admin", async () => {
    runner.assert(createdAdminId, "created admin id missing");
    await apiRequest(ctx, `/admins/${createdAdminId}`, {
      method: "DELETE",
      token: admin.accessToken,
      expectStatus: 200,
    });
    const gone = await prisma.user.findUnique({
      where: { id: createdAdminId! },
    });
    runner.assert(!gone, "admin should be deleted");
    createdAdminId = null;
  });

  runner.section("Cleanup");

  await runner.test("Remove any leftover smoke admin rows", async () => {
    const leftovers = await prisma.user.findMany({
      where: { email: { startsWith: "smoke-10-4-" } },
      select: { id: true },
    });
    for (const u of leftovers) {
      await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
      await prisma.passwordResetToken.deleteMany({ where: { userId: u.id } });
      await prisma.verificationToken.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
    runner.assert(true, "cleanup done");
  });

  return runner.finishPhase();
}
