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
import { getSmokeGameAndPlatformIds } from "../lib/product-fixtures.mts";

const APPLY_PASSWORD = "smoke-10-5-3-4-pass";
const BUYER_EMAIL = () =>
  process.env.SMOKE_BUYER_EMAIL?.trim() || "buyer@buyer.com";
const BUYER_PASSWORD = () =>
  process.env.SMOKE_BUYER_PASSWORD?.trim() || "buyer123";

function smokeProductPayload(
  title: string,
  gameId: string,
  platformId: string
) {
  return {
    gameId,
    platformId,
    title,
    description: "Phase 10.5.3-4 listing gate smoke",
    price: 12.99,
    specifications: { rank: "Gold" },
    accountUsername: "smoke_user",
    accountPassword: "smoke_pass",
    accountEmail: "smoke@example.com",
    accountEmailPassword: "smoke_email_pass",
  };
}

async function productListedPublic(
  ctx: SmokeContext,
  productId: string
): Promise<boolean> {
  const listRes = await apiRequest<{ products: { id: string }[] }>(
    ctx,
    "/products?pageSize=100",
    { expectStatus: 200 }
  );
  if (listRes.data.products.some((p) => p.id === productId)) return true;

  const detailRes = await fetch(`${ctx.apiBase}/products/${productId}`);
  return detailRes.status === 200;
}

export async function runPhase10_5_3_4(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner(
    "Phase 10.5.3-4 — Promote removal + storefront listing gate"
  );
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  const admin = await loginAdmin(ctx.apiBase);
  const applyEmail = `smoke-10-5-3-4-${Date.now()}@test.com`;
  let sellerUserId: string | null = null;
  let productId: string | null = null;

  runner.section("10.5.3 — No promote-to-seller");

  await runner.test("PATCH /users/:id/promote-seller returns 404", async () => {
    const buyer = await prisma.user.findFirst({
      where: { email: BUYER_EMAIL() },
      select: { id: true },
    });
    runner.assert(buyer, "buyer seed missing");
    await apiRequest(ctx, `/users/${buyer!.id}/promote-seller`, {
      method: "PATCH",
      token: admin.accessToken,
      expectStatus: 404,
    });
  });

  await runner.test("PATCH /users/:id/role rejects SELLER", async () => {
    const buyer = await prisma.user.findFirst({
      where: { email: BUYER_EMAIL() },
      select: { id: true },
    });
    runner.assert(buyer, "buyer seed missing");
    await apiRequest(ctx, `/users/${buyer!.id}/role`, {
      method: "PATCH",
      token: admin.accessToken,
      body: { role: Role.SELLER },
      expectStatus: 400,
    });
  });

  runner.section("10.5.4 — Listing gate");

  await runner.test("Pending seller ACTIVE product hidden from storefront", async () => {
    const { data: applied } = await apiRequest<{
      user: { id: string; sellerApprovalStatus: string };
    }>(ctx, "/auth/seller/apply", {
      method: "POST",
      body: {
        email: applyEmail,
        password: APPLY_PASSWORD,
        name: "Smoke Listing Gate",
      },
      expectStatus: 201,
    });
    sellerUserId = applied.user.id;
    runner.assert(
      applied.user.sellerApprovalStatus === SellerApprovalStatus.PENDING,
      "expected PENDING"
    );

    const seller = await loginSellerPortal(
      ctx.apiBase,
      applyEmail,
      APPLY_PASSWORD
    );
    const { gameId, platformId } = await getSmokeGameAndPlatformIds(ctx);

    const { data: created } = await apiRequest<{ id: string; status: string }>(
      ctx,
      "/products",
      {
        method: "POST",
        token: seller.accessToken,
        body: {
          ...smokeProductPayload(
            `smoke-10-5-3-4-product-${Date.now()}`,
            gameId,
            platformId
          ),
          publish: true,
        },
        expectStatus: 201,
      }
    );
    productId = created.id;
    runner.assert(created.status === "ACTIVE", "expected ACTIVE in seller portal");

    const listedBefore = await productListedPublic(ctx, productId!);
    runner.assert(!listedBefore, "unapproved seller product must not list publicly");
  });

  await runner.test("Cart add blocked for unapproved seller product", async () => {
    runner.assert(productId, "product id missing");
    const buyer = await loginBuyerPortal(
      ctx.apiBase,
      BUYER_EMAIL(),
      BUYER_PASSWORD()
    );
    await apiRequest(ctx, `/cart/${productId}`, {
      method: "POST",
      token: buyer.accessToken,
      expectStatus: 400,
    });
  });

  await runner.test("Approve seller — product appears on storefront", async () => {
    runner.assert(sellerUserId, "seller user id missing");
    runner.assert(productId, "product id missing");

    await apiRequest(ctx, `/sellers/${sellerUserId}/approve`, {
      method: "PATCH",
      token: admin.accessToken,
      expectStatus: 200,
    });

    const listedAfter = await productListedPublic(ctx, productId!);
    runner.assert(listedAfter, "approved seller product should list publicly");
  });

  await runner.test("Buyer can add approved product to cart", async () => {
    runner.assert(productId, "product id missing");
    const buyer = await loginBuyerPortal(
      ctx.apiBase,
      BUYER_EMAIL(),
      BUYER_PASSWORD()
    );
    await apiRequest(ctx, `/cart/${productId}`, {
      method: "POST",
      token: buyer.accessToken,
      expectStatus: 200,
    });
  });

  runner.section("Cleanup");

  await runner.test("Remove smoke 10.5.3-4 data", async () => {
    if (productId) {
      await prisma.cartItem.deleteMany({ where: { productId } });
      await prisma.product.deleteMany({ where: { id: productId } });
    }
    if (sellerUserId) {
      const cart = await prisma.cart.findUnique({
        where: { userId: sellerUserId },
      });
      if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        await prisma.cart.delete({ where: { id: cart.id } });
      }
      await prisma.refreshToken.deleteMany({ where: { userId: sellerUserId } });
      await prisma.passwordResetToken.deleteMany({
        where: { userId: sellerUserId },
      });
      await prisma.verificationToken.deleteMany({
        where: { userId: sellerUserId },
      });
      await prisma.sellerWallet.deleteMany({ where: { userId: sellerUserId } });
      await prisma.user.delete({ where: { id: sellerUserId } });
    }
    runner.assert(true, "cleanup done");
  });

  return runner.finishPhase();
}
