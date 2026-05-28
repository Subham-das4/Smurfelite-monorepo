import bcrypt from "bcrypt";
import { prisma } from "../../../src/lib/prisma.js";
import {
  Role,
  SellerApprovalStatus,
} from "../../../src/types/prisma.js";
import { SmokeRunner } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import {
  apiRequest,
  loginAdmin,
  loginBuyerPortal,
  loginSellerPortal,
} from "../lib/http.mts";

const BUYER_EMAIL = () =>
  process.env.SMOKE_BUYER_EMAIL?.trim() || "buyer@buyer.com";
const BUYER_PASSWORD = () =>
  process.env.SMOKE_BUYER_PASSWORD?.trim() || "buyer123";
const SELLER_EMAIL = () =>
  process.env.SMOKE_SELLER_EMAIL?.trim() || "seller@seller.com";
const ADMIN_EMAIL = () =>
  process.env.SMOKE_ADMIN_EMAIL?.trim() || "admin@admin.com";
const APPLY_PASSWORD = "smoke-seller-apply-10-5";
const KNOWN_INVITE_PASSWORD = "smoke-seller-invite-10-5";

export async function runPhase10_5(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 10.5 — Seller apply & admin seller API");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  const admin = await loginAdmin(ctx.apiBase);
  const applyNewEmail = `smoke-10-5-apply-${Date.now()}@test.com`;
  const inviteEmail = `smoke-10-5-invite-${Date.now()}@test.com`;
  const rejectEmail = `smoke-10-5-reject-${Date.now()}@test.com`;
  let applyNewUserId: string | null = null;
  let inviteUserId: string | null = null;
  let rejectUserId: string | null = null;

  runner.section("10.5.1 — Seller self-apply");

  await runner.test("POST /auth/seller/apply — new account", async () => {
    const { data } = await apiRequest<{
      user: { id: string; role: string; sellerApprovalStatus: string };
    }>(ctx, "/auth/seller/apply", {
      method: "POST",
      body: {
        email: applyNewEmail,
        password: APPLY_PASSWORD,
        name: "Smoke Apply New",
      },
      expectStatus: 201,
    });
    runner.assert(data.user.role === Role.SELLER, "expected SELLER");
    runner.assert(
      data.user.sellerApprovalStatus === SellerApprovalStatus.PENDING,
      "expected PENDING"
    );
    applyNewUserId = data.user.id;

    const wallet = await prisma.sellerWallet.findUnique({
      where: { userId: applyNewUserId },
    });
    runner.assert(wallet, "seller wallet should exist");
  });

  await runner.test("POST /auth/seller/apply — idempotent PENDING", async () => {
    const { data } = await apiRequest<{ user: { id: string } }>(
      ctx,
      "/auth/seller/apply",
      {
        method: "POST",
        body: {
          email: applyNewEmail,
          password: APPLY_PASSWORD,
          name: "Smoke Apply New",
        },
        expectStatus: 200,
      }
    );
    runner.assert(data.user.id === applyNewUserId, "same user id");
  });

  await runner.test("POST /auth/seller/apply — seller login while PENDING", async () => {
    const { accessToken } = await loginSellerPortal(
      ctx.apiBase,
      applyNewEmail,
      APPLY_PASSWORD
    );
    runner.assert(accessToken, "expected access token");
    await apiRequest(ctx, "/products/mine", {
      token: accessToken,
      expectStatus: 200,
    });
  });

  await runner.test("POST /auth/seller/apply — upgrade buyer preserves cart", async () => {
    const upgradeEmail = `smoke-10-5-buyer-upgrade-${Date.now()}@test.com`;
    const hashed = await bcrypt.hash(APPLY_PASSWORD, 10);
    const buyer = await prisma.user.create({
      data: {
        email: upgradeEmail,
        password: hashed,
        name: "Smoke Buyer Upgrade",
        role: Role.BUYER,
        isVerified: true,
      },
    });
    const cart = await prisma.cart.create({ data: { userId: buyer.id } });
    const cartIdBefore = cart.id;

    const { data } = await apiRequest<{
      user: { id: string; role: string; sellerApprovalStatus: string };
    }>(ctx, "/auth/seller/apply", {
      method: "POST",
      body: {
        email: upgradeEmail,
        password: APPLY_PASSWORD,
        name: "Upgraded Buyer",
      },
      expectStatus: 200,
    });
    runner.assert(data.user.id === buyer.id, "same user upgraded");
    runner.assert(data.user.role === Role.SELLER, "upgraded to SELLER");
    runner.assert(
      data.user.sellerApprovalStatus === SellerApprovalStatus.PENDING,
      "expected PENDING"
    );

    const cartAfter = await prisma.cart.findUnique({
      where: { userId: buyer.id },
    });
    runner.assert(cartAfter?.id === cartIdBefore, "cart should be preserved");
  });

  await runner.test("POST /auth/seller/apply — rejects admin email", async () => {
    await apiRequest(ctx, "/auth/seller/apply", {
      method: "POST",
      body: {
        email: ADMIN_EMAIL(),
        password: APPLY_PASSWORD,
        name: "Blocked Admin",
      },
      expectStatus: 409,
    });
  });

  await runner.test("POST /auth/seller/apply — rejects approved seed seller", async () => {
    await apiRequest(ctx, "/auth/seller/apply", {
      method: "POST",
      body: {
        email: SELLER_EMAIL(),
        password: APPLY_PASSWORD,
        name: "Blocked Approved",
      },
      expectStatus: 409,
    });
  });

  runner.section("10.5.2 — Admin seller governance");

  await runner.test("Buyer cannot POST /sellers", async () => {
    const buyer = await loginBuyerPortal(
      ctx.apiBase,
      BUYER_EMAIL(),
      BUYER_PASSWORD()
    );
    await apiRequest(ctx, "/sellers", {
      method: "POST",
      token: buyer.accessToken,
      body: { email: `blocked-${Date.now()}@test.com`, name: "Blocked" },
      expectStatus: 403,
    });
  });

  await runner.test("POST /sellers — admin invite", async () => {
    const { data } = await apiRequest<{
      seller: {
        id: string;
        email: string;
        sellerApprovalStatus: string;
        createdByAdminId: string | null;
      };
    }>(ctx, "/sellers", {
      method: "POST",
      token: admin.accessToken,
      body: { email: inviteEmail, name: "Smoke Invited Seller" },
      expectStatus: 201,
    });
    runner.assert(
      data.seller.sellerApprovalStatus === SellerApprovalStatus.PENDING,
      "expected PENDING"
    );
    runner.assert(
      data.seller.createdByAdminId === admin.userId,
      "createdByAdminId should match admin"
    );
    inviteUserId = data.seller.id;
  });

  await runner.test("GET /sellers?status=PENDING — includes invite", async () => {
    const { data } = await apiRequest<{
      sellers: Array<{ id: string; email: string }>;
    }>(ctx, "/sellers?status=PENDING&pageSize=100", {
      token: admin.accessToken,
      expectStatus: 200,
    });
    runner.assert(
      data.sellers.some((s) => s.id === inviteUserId),
      "pending list should include invited seller"
    );
  });

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

  await runner.test("POST /sellers — rejects duplicate approved seed", async () => {
    await apiRequest(ctx, "/sellers", {
      method: "POST",
      token: admin.accessToken,
      body: { email: SELLER_EMAIL(), name: "Duplicate Approved" },
      expectStatus: 409,
    });
  });

  await runner.test("POST /sellers + PATCH reject with note", async () => {
    const { data: created } = await apiRequest<{ seller: { id: string } }>(
      ctx,
      "/sellers",
      {
        method: "POST",
        token: admin.accessToken,
        body: { email: rejectEmail, name: "Smoke Reject Seller" },
        expectStatus: 201,
      }
    );
    rejectUserId = created.seller.id;

    const { data } = await apiRequest<{
      seller: {
        sellerApprovalStatus: string;
        sellerRejectionNote: string | null;
      };
    }>(ctx, `/sellers/${rejectUserId}/reject`, {
      method: "PATCH",
      token: admin.accessToken,
      body: { note: "Smoke rejection note" },
      expectStatus: 200,
    });
    runner.assert(
      data.seller.sellerApprovalStatus === SellerApprovalStatus.REJECTED,
      "expected REJECTED"
    );
    runner.assert(
      data.seller.sellerRejectionNote === "Smoke rejection note",
      "expected rejection note"
    );
  });

  await runner.test("Invited seller can login after password set", async () => {
    runner.assert(inviteUserId, "invite user id missing");
    const hashed = await bcrypt.hash(KNOWN_INVITE_PASSWORD, 10);
    await prisma.user.update({
      where: { id: inviteUserId! },
      data: { password: hashed },
    });
    const { accessToken } = await loginSellerPortal(
      ctx.apiBase,
      inviteEmail,
      KNOWN_INVITE_PASSWORD
    );
    runner.assert(accessToken, "expected seller portal token");
  });

  runner.section("Cleanup");

  await runner.test("Remove smoke seller rows", async () => {
    const users = await prisma.user.findMany({
      where: { email: { startsWith: "smoke-10-5-" } },
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
