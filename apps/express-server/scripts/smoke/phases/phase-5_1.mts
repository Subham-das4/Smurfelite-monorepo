import { prisma } from "../../../src/lib/prisma.js";
import { ensureSellerUser } from "../../../src/lib/prisma.js";
import { ProductStatus } from "../../../src/types/prisma.js";
import { SmokeRunner } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest, loginAdmin, loginSeller } from "../lib/http.mts";

const SMOKE_TITLE_PREFIX = "smoke-phase-5.1-";

interface ProductResponse {
  id: string;
  status: string;
  sellerDelisted?: boolean;
  isAvailable?: boolean;
}

function smokeProductPayload(title: string) {
  return {
    gameType: "Valorant",
    title,
    description: "Phase 5.1 lifecycle smoke product",
    price: 9.99,
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
  const listRes = await apiRequest<{ products: { id: string }[] }>(ctx, "/products", {
    expectStatus: 200,
  });
  if (listRes.data.products.some((p) => p.id === productId)) return true;

  const detailRes = await fetch(`${ctx.apiBase}/products/${productId}`);
  return detailRes.status === 200;
}

export async function runPhase5_1(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 5.1 — Product lifecycle (seller + admin)");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  await ensureSellerUser();

  const seller = await loginSeller(ctx.apiBase);
  const admin = await loginAdmin(ctx.apiBase);

  const uniqueTitle = `${SMOKE_TITLE_PREFIX}${Date.now()}`;
  let productId: string | undefined;

  runner.section("Seller create & publish");

  await runner.test("POST /products creates DRAFT by default", async () => {
    const { data } = await apiRequest<ProductResponse>(ctx, "/products", {
      method: "POST",
      token: seller.accessToken,
      body: smokeProductPayload(uniqueTitle),
      expectStatus: 201,
    });
    runner.assert(data.status === "DRAFT", `expected DRAFT, got ${data.status}`);
    productId = data.id;
  });

  await runner.test("DRAFT product is not publicly listable", async () => {
    runner.assert(productId, "missing product id");
    const listed = await productListedPublic(ctx, productId!);
    runner.assert(!listed, "draft should not appear on storefront");
  });

  await runner.test("PATCH /products/:id/publish sets ACTIVE", async () => {
    runner.assert(productId, "missing product id");
    const { data } = await apiRequest<ProductResponse>(
      ctx,
      `/products/${productId}/publish`,
      {
        method: "PATCH",
        token: seller.accessToken,
        expectStatus: 200,
      }
    );
    runner.assert(data.status === "ACTIVE", "expected ACTIVE after publish");
  });

  await runner.test("Published product is publicly listable", async () => {
    runner.assert(productId, "missing product id");
    const listed = await productListedPublic(ctx, productId!);
    runner.assert(listed, "published product should be listable");
  });

  runner.section("Seller delist & reactivate");

  await runner.test("PATCH /products/:id/delist hides from storefront", async () => {
    runner.assert(productId, "missing product id");
    const { data } = await apiRequest<ProductResponse>(
      ctx,
      `/products/${productId}/delist`,
      {
        method: "PATCH",
        token: seller.accessToken,
        expectStatus: 200,
      }
    );
    runner.assert(
      data.status === "DELISTED_BY_SELLER",
      "expected DELISTED_BY_SELLER"
    );
    const listed = await productListedPublic(ctx, productId!);
    runner.assert(!listed, "delisted product should not be listable");
  });

  await runner.test("PATCH /products/:id/reactivate restores listing", async () => {
    runner.assert(productId, "missing product id");
    const { data } = await apiRequest<ProductResponse>(
      ctx,
      `/products/${productId}/reactivate`,
      {
        method: "PATCH",
        token: seller.accessToken,
        expectStatus: 200,
      }
    );
    runner.assert(data.status === "ACTIVE", "expected ACTIVE after reactivate");
    const listed = await productListedPublic(ctx, productId!);
    runner.assert(listed, "reactivated product should be listable");
  });

  runner.section("Admin ban & lift ban (no approval flow)");

  await runner.test("PATCH /products/:id/ban requires admin", async () => {
    runner.assert(productId, "missing product id");
    await apiRequest(ctx, `/products/${productId}/ban`, {
      method: "PATCH",
      token: seller.accessToken,
      expectStatus: 403,
    });
  });

  await runner.test("Admin PATCH /products/:id/ban removes from storefront", async () => {
    runner.assert(productId, "missing product id");
    const { data } = await apiRequest<ProductResponse>(
      ctx,
      `/products/${productId}/ban`,
      {
        method: "PATCH",
        token: admin.accessToken,
        expectStatus: 200,
      }
    );
    runner.assert(data.status === "BANNED_BY_ADMIN", "expected BANNED_BY_ADMIN");
    const listed = await productListedPublic(ctx, productId!);
    runner.assert(!listed, "banned product should not be listable");
  });

  await runner.test("Admin PATCH /products/:id/lift-ban restores ACTIVE listing", async () => {
    runner.assert(productId, "missing product id");
    const { data } = await apiRequest<ProductResponse>(
      ctx,
      `/products/${productId}/lift-ban`,
      {
        method: "PATCH",
        token: admin.accessToken,
        expectStatus: 200,
      }
    );
    runner.assert(data.status === "ACTIVE", "expected ACTIVE after lift-ban");
    const listed = await productListedPublic(ctx, productId!);
    runner.assert(listed, "unbanned product should be listable");
  });

  runner.section("Soft delete");

  await runner.test("DELETE /products/:id soft-deletes (not publicly visible)", async () => {
    runner.assert(productId, "missing product id");
    await apiRequest(ctx, `/products/${productId}`, {
      method: "DELETE",
      token: seller.accessToken,
      expectStatus: 204,
    });
    const row = await prisma.product.findUnique({
      where: { id: productId! },
      select: { deletedAt: true },
    });
    runner.assert(row?.deletedAt, "deletedAt should be set");
    const listed = await productListedPublic(ctx, productId!);
    runner.assert(!listed, "soft-deleted product should not be listable");
  });

  await runner.test("POST /products?publish=true creates ACTIVE immediately", async () => {
    const title = `${SMOKE_TITLE_PREFIX}publish-${Date.now()}`;
    const { data } = await apiRequest<ProductResponse>(ctx, "/products", {
      method: "POST",
      token: seller.accessToken,
      body: { ...smokeProductPayload(title), publish: true },
      expectStatus: 201,
    });
    runner.assert(data.status === "ACTIVE", "publish:true should create ACTIVE");
    const listed = await productListedPublic(ctx, data.id);
    runner.assert(listed, "publish:true product should be listable");

    await prisma.product.update({
      where: { id: data.id },
      data: { deletedAt: new Date(), isAvailable: false },
    });
  });

  runner.section("Cleanup");

  await runner.test("Remove smoke products from DB", async () => {
    const deleted = await prisma.product.deleteMany({
      where: { title: { startsWith: SMOKE_TITLE_PREFIX } },
    });
    runner.assert(deleted.count >= 1, "expected at least one smoke product cleaned up");
  });

  // Restore any accidental status drift on seeded catalog products
  await prisma.product.updateMany({
    where: {
      title: { not: { startsWith: SMOKE_TITLE_PREFIX } },
      status: ProductStatus.BANNED_BY_ADMIN,
    },
    data: {
      status: ProductStatus.ACTIVE,
      isAvailable: true,
      sellerDelisted: false,
    },
  });

  return runner.finishPhase();
}
