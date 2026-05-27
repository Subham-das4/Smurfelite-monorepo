import { prisma } from "../../../src/lib/prisma.js";
import { ensureSellerUser } from "../../../src/lib/prisma.js";
import { ProductStatus } from "../../../src/types/prisma.js";
import { SmokeRunner } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest, loginAdmin, loginSeller } from "../lib/http.mts";
import { getSmokeGameAndPlatformIds } from "../lib/product-fixtures.mts";

const SMOKE_TITLE_PREFIX = "smoke-phase-5.3-";

async function isProductPubliclyListed(
  ctx: SmokeContext,
  productId: string
): Promise<boolean> {
  const res = await fetch(`${ctx.apiBase}/products/${productId}`);
  return res.status === 200;
}

export async function runPhase5_3(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 5.3 — Admin seller delist / reactivate");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  await ensureSellerUser();

  const admin = await loginAdmin(ctx.apiBase);
  const seller = await loginSeller(ctx.apiBase);
  const { gameId, platformId } = await getSmokeGameAndPlatformIds(ctx);

  let productId: string | undefined;
  let selfDelistedProductId: string | undefined;

  runner.section("Setup seller listings");

  await runner.test("Create and publish product for cascade test", async () => {
    const { data } = await apiRequest<{ id: string; status: string }>(ctx, "/products", {
      method: "POST",
      token: seller.accessToken,
      body: {
        gameId,
        platformId,
        title: `${SMOKE_TITLE_PREFIX}cascade-${Date.now()}`,
        price: 12,
        specifications: {},
        accountUsername: "u",
        accountPassword: "p",
        accountEmail: "e",
        accountEmailPassword: "ep",
        publish: true,
      },
      expectStatus: 201,
    });
    productId = data.id;
    runner.assert(data.status === "ACTIVE", "expected ACTIVE");
    const listed = await isProductPubliclyListed(ctx, productId);
    runner.assert(listed, "product should be listable before admin delist");
  });

  await runner.test("Seller self-delisted product stays separate from admin cascade", async () => {
    const { data } = await apiRequest<{ id: string }>(ctx, "/products", {
      method: "POST",
      token: seller.accessToken,
      body: {
        gameId,
        platformId,
        title: `${SMOKE_TITLE_PREFIX}self-${Date.now()}`,
        price: 11,
        specifications: {},
        accountUsername: "u2",
        accountPassword: "p2",
        accountEmail: "e2",
        accountEmailPassword: "ep2",
        publish: true,
      },
      expectStatus: 201,
    });
    selfDelistedProductId = data.id;
    await apiRequest(ctx, `/products/${selfDelistedProductId}/delist`, {
      method: "PATCH",
      token: seller.accessToken,
      expectStatus: 200,
    });
    const listed = await isProductPubliclyListed(ctx, selfDelistedProductId);
    runner.assert(!listed, "self-delisted product hidden");
  });

  runner.section("Admin delist seller");

  await runner.test("PATCH /users/:id/delist requires admin", async () => {
    await apiRequest(ctx, `/users/${seller.userId}/delist`, {
      method: "PATCH",
      token: seller.accessToken,
      expectStatus: 403,
    });
  });

  await runner.test("PATCH /users/:id/delist cascades product visibility", async () => {
    runner.assert(productId, "missing product id");
    const { data } = await apiRequest<{ sellerDelisted: boolean }>(
      ctx,
      `/users/${seller.userId}/delist`,
      {
        method: "PATCH",
        token: admin.accessToken,
        expectStatus: 200,
      }
    );
    runner.assert(data.sellerDelisted === true, "user.sellerDelisted should be true");

    const product = await prisma.product.findUnique({
      where: { id: productId! },
      select: { sellerDelisted: true, status: true },
    });
    runner.assert(product?.sellerDelisted === true, "product sellerDelisted cascaded");
    runner.assert(product?.status === "ACTIVE", "status unchanged on admin delist");

    const listed = await isProductPubliclyListed(ctx, productId!);
    runner.assert(!listed, "cascaded product hidden from storefront");
  });

  await runner.test("Delisted seller cannot create new products", async () => {
    await apiRequest(ctx, "/products", {
      method: "POST",
      token: seller.accessToken,
      body: {
        gameId,
        platformId,
        title: `${SMOKE_TITLE_PREFIX}blocked-${Date.now()}`,
        price: 8,
        specifications: {},
        accountUsername: "u3",
        accountPassword: "p3",
        accountEmail: "e3",
        accountEmailPassword: "ep3",
      },
      expectStatus: 403,
    });
  });

  runner.section("Admin reactivate seller");

  await runner.test("PATCH /users/:id/reactivate restores active listings", async () => {
    runner.assert(productId && selfDelistedProductId, "missing product ids");
    const { data } = await apiRequest<{ sellerDelisted: boolean }>(
      ctx,
      `/users/${seller.userId}/reactivate`,
      {
        method: "PATCH",
        token: admin.accessToken,
        expectStatus: 200,
      }
    );
    runner.assert(data.sellerDelisted === false, "user.sellerDelisted should be false");

    const cascadeProduct = await prisma.product.findUnique({
      where: { id: productId! },
      select: { sellerDelisted: true },
    });
    runner.assert(
      cascadeProduct?.sellerDelisted === false,
      "admin-cascaded product restored"
    );
    const listed = await isProductPubliclyListed(ctx, productId!);
    runner.assert(listed, "cascaded product visible again");

    const selfDelisted = await prisma.product.findUnique({
      where: { id: selfDelistedProductId! },
      select: { sellerDelisted: true, status: true },
    });
    runner.assert(
      selfDelisted?.status === ProductStatus.DELISTED_BY_SELLER,
      "self-delisted status preserved"
    );
    runner.assert(
      selfDelisted?.sellerDelisted === true,
      "self-delisted product stays hidden after seller reactivate"
    );
    const selfListed = await isProductPubliclyListed(ctx, selfDelistedProductId!);
    runner.assert(!selfListed, "self-delisted product still not public");
  });

  runner.section("Cleanup");

  await runner.test("Remove smoke products and reset seller flag", async () => {
    await prisma.product.deleteMany({
      where: { title: { startsWith: SMOKE_TITLE_PREFIX } },
    });
    await prisma.user.update({
      where: { id: seller.userId },
      data: { sellerDelisted: false },
    });
  });

  return runner.finishPhase();
}
