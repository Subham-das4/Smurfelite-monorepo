import { prisma } from "../../../src/lib/prisma.js";
import { SellerApprovalStatus } from "../../../src/types/prisma.js";
import { SmokeRunner } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import {
  apiRequest,
  loginAdmin,
  loginBuyerPortal,
} from "../lib/http.mts";

const BUYER_EMAIL = () =>
  process.env.SMOKE_BUYER_EMAIL?.trim() || "buyer@buyer.com";
const BUYER_PASSWORD = () =>
  process.env.SMOKE_BUYER_PASSWORD?.trim() || "buyer123";

export async function runPhase10_6_4(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner(
    "Phase 10.6.4 — Seller governance (admin UI contract)"
  );
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  const admin = await loginAdmin(ctx.apiBase);
  const inviteEmail = `smoke-10-6-4-invite-${Date.now()}@test.com`;
  const rejectEmail = `smoke-10-6-4-reject-${Date.now()}@test.com`;
  let inviteUserId: string | null = null;
  let rejectUserId: string | null = null;

  runner.section("Authorization");

  await runner.test("Buyer cannot GET /sellers", async () => {
    const buyer = await loginBuyerPortal(
      ctx.apiBase,
      BUYER_EMAIL(),
      BUYER_PASSWORD()
    );
    await apiRequest(ctx, "/sellers?status=PENDING", {
      token: buyer.accessToken,
      expectStatus: 403,
    });
  });

  runner.section("Invite and pending list");

  await runner.test("POST /sellers — create pending invite", async () => {
    const { data } = await apiRequest<{
      seller: { id: string; sellerApprovalStatus: string };
    }>(ctx, "/sellers", {
      method: "POST",
      token: admin.accessToken,
      body: { email: inviteEmail, name: "Smoke 10.6.4 Invite" },
      expectStatus: 201,
    });
    runner.assert(
      data.seller.sellerApprovalStatus === SellerApprovalStatus.PENDING,
      "expected PENDING"
    );
    inviteUserId = data.seller.id;
  });

  await runner.test("GET /sellers?status=PENDING — includes invite", async () => {
    const { data } = await apiRequest<{
      sellers: Array<{ id: string }>;
    }>(ctx, "/sellers?status=PENDING&pageSize=100", {
      token: admin.accessToken,
      expectStatus: 200,
    });
    runner.assert(
      data.sellers.some((s) => s.id === inviteUserId),
      "pending list should include invited seller"
    );
  });

  runner.section("Approve and approved list");

  await runner.test("PATCH /sellers/:id/approve", async () => {
    runner.assert(inviteUserId, "invite user id missing");
    const { data } = await apiRequest<{
      seller: { sellerApprovalStatus: string; sellerApprovedAt: string | null };
    }>(ctx, `/sellers/${inviteUserId}/approve`, {
      method: "PATCH",
      token: admin.accessToken,
      expectStatus: 200,
    });
    runner.assert(
      data.seller.sellerApprovalStatus === SellerApprovalStatus.APPROVED,
      "expected APPROVED"
    );
    runner.assert(data.seller.sellerApprovedAt, "sellerApprovedAt should be set");
  });

  await runner.test("GET /sellers?status=APPROVED — includes approved seller", async () => {
    const { data } = await apiRequest<{
      sellers: Array<{ id: string }>;
    }>(ctx, "/sellers?status=APPROVED&pageSize=100", {
      token: admin.accessToken,
      expectStatus: 200,
    });
    runner.assert(
      data.sellers.some((s) => s.id === inviteUserId),
      "approved list should include approved seller"
    );
  });

  runner.section("Reject and rejected list");

  await runner.test("POST /sellers — second invite for reject flow", async () => {
    const { data } = await apiRequest<{ seller: { id: string } }>(ctx, "/sellers", {
      method: "POST",
      token: admin.accessToken,
      body: { email: rejectEmail, name: "Smoke 10.6.4 Reject" },
      expectStatus: 201,
    });
    rejectUserId = data.seller.id;
  });

  await runner.test("PATCH /sellers/:id/reject with note", async () => {
    runner.assert(rejectUserId, "reject user id missing");
    const { data } = await apiRequest<{
      seller: {
        sellerApprovalStatus: string;
        sellerRejectionNote: string | null;
      };
    }>(ctx, `/sellers/${rejectUserId}/reject`, {
      method: "PATCH",
      token: admin.accessToken,
      body: { note: "Smoke 10.6.4 reject" },
      expectStatus: 200,
    });
    runner.assert(
      data.seller.sellerApprovalStatus === SellerApprovalStatus.REJECTED,
      "expected REJECTED"
    );
    runner.assert(
      data.seller.sellerRejectionNote === "Smoke 10.6.4 reject",
      "expected rejection note"
    );
  });

  await runner.test("GET /sellers?status=REJECTED — includes rejected seller + note", async () => {
    const { data } = await apiRequest<{
      sellers: Array<{
        id: string;
        sellerRejectionNote: string | null;
      }>;
    }>(ctx, "/sellers?status=REJECTED&pageSize=100", {
      token: admin.accessToken,
      expectStatus: 200,
    });
    const row = data.sellers.find((s) => s.id === rejectUserId);
    runner.assert(row, "rejected list should include rejected seller");
    runner.assert(
      row?.sellerRejectionNote === "Smoke 10.6.4 reject",
      "rejected list should include note"
    );
  });

  runner.section("Guards");

  await runner.test("PATCH /sellers/:id/approve on unknown id — 404", async () => {
    await apiRequest(ctx, "/sellers/00000000-0000-0000-0000-000000000099/approve", {
      method: "PATCH",
      token: admin.accessToken,
      expectStatus: 404,
    });
  });

  runner.section("Cleanup");

  await runner.test("Remove smoke-10-6-4-* users", async () => {
    const users = await prisma.user.findMany({
      where: { email: { startsWith: "smoke-10-6-4-" } },
      select: { id: true },
    });
    for (const u of users) {
      const cart = await prisma.cart.findUnique({ where: { userId: u.id } });
      if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        await prisma.cart.delete({ where: { id: cart.id } });
      }
      await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
      await prisma.passwordResetToken.deleteMany({ where: { userId: u.id } });
      await prisma.verificationToken.deleteMany({ where: { userId: u.id } });
      await prisma.sellerWallet.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
    runner.assert(true, "cleanup done");
  });

  return runner.finishPhase();
}
