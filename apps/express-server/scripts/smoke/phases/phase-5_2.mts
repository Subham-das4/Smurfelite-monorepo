import { prisma } from "../../../src/lib/prisma.js";
import { SmokeRunner } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest, loginAdmin, loginSeller } from "../lib/http.mts";

const SMOKE_SLUG_PREFIX = "smoke-5-2-";

interface GameCategory {
  id: string;
  name: string;
  slug: string;
  isRestricted: boolean;
}

export async function runPhase5_2(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 5.2 — Game categories (admin API)");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  const admin = await loginAdmin(ctx.apiBase);
  const seller = await loginSeller(ctx.apiBase);

  const slug = `${SMOKE_SLUG_PREFIX}${Date.now()}`;
  let categoryId: string | undefined;

  runner.section("Public read");

  await runner.test("GET /game-categories returns 200 (no longer 501)", async () => {
    const { status, data } = await apiRequest<{ categories: GameCategory[] }>(
      ctx,
      "/game-categories",
      { expectStatus: 200 }
    );
    runner.assert(status === 200, "expected 200");
    runner.assert(Array.isArray(data.categories), "categories array expected");
  });

  runner.section("Admin CRUD");

  await runner.test("POST /game-categories requires admin", async () => {
    await apiRequest(ctx, "/game-categories", {
      method: "POST",
      token: seller.accessToken,
      body: { name: "Blocked Category" },
      expectStatus: 403,
    });
  });

  await runner.test("POST /game-categories creates category", async () => {
    const { data } = await apiRequest<GameCategory>(ctx, "/game-categories", {
      method: "POST",
      token: admin.accessToken,
      body: { name: "Smoke Test Game", slug },
      expectStatus: 201,
    });
    runner.assert(data.slug === slug, "slug mismatch");
    runner.assert(data.isRestricted === false, "default not restricted");
    categoryId = data.id;
  });

  await runner.test("GET /game-categories/:id returns category", async () => {
    runner.assert(categoryId, "missing category id");
    const { data } = await apiRequest<GameCategory>(
      ctx,
      `/game-categories/${categoryId}`,
      { expectStatus: 200 }
    );
    runner.assert(data.id === categoryId, "id mismatch");
  });

  await runner.test("PATCH /game-categories/:id/restrict toggles restriction", async () => {
    runner.assert(categoryId, "missing category id");
    const { data } = await apiRequest<GameCategory>(
      ctx,
      `/game-categories/${categoryId}/restrict`,
      {
        method: "PATCH",
        token: admin.accessToken,
        body: {},
        expectStatus: 200,
      }
    );
    runner.assert(data.isRestricted === true, "expected restricted after toggle");
  });

  runner.section("Block listings in restricted categories");

  await runner.test("POST /products in restricted gameCategoryId is rejected", async () => {
    runner.assert(categoryId, "missing category id");
    await apiRequest(ctx, "/products", {
      method: "POST",
      token: seller.accessToken,
      body: {
        gameType: "Smoke Test Game",
        gameCategoryId: categoryId,
        title: `restricted-${Date.now()}`,
        price: 5,
        specifications: {},
        accountUsername: "u",
        accountPassword: "p",
        accountEmail: "e",
        accountEmailPassword: "ep",
      },
      expectStatus: 400,
    });
  });

  await runner.test("PATCH /game-categories/:id/restrict un-restricts category", async () => {
    runner.assert(categoryId, "missing category id");
    const { data } = await apiRequest<GameCategory>(
      ctx,
      `/game-categories/${categoryId}/restrict`,
      {
        method: "PATCH",
        token: admin.accessToken,
        body: { isRestricted: false },
        expectStatus: 200,
      }
    );
    runner.assert(data.isRestricted === false, "expected unrestricted");
  });

  await runner.test("POST /products allowed after category unrestricted", async () => {
    runner.assert(categoryId, "missing category id");
    const { data } = await apiRequest<{ id: string; status: string }>(ctx, "/products", {
      method: "POST",
      token: seller.accessToken,
      body: {
        gameType: "Smoke Test Game",
        gameCategoryId: categoryId,
        title: `allowed-${Date.now()}`,
        price: 5,
        specifications: {},
        accountUsername: "u",
        accountPassword: "p",
        accountEmail: "e",
        accountEmailPassword: "ep",
      },
      expectStatus: 201,
    });
    await prisma.product.delete({ where: { id: data.id } });
  });

  runner.section("Cleanup");

  await runner.test("DELETE /game-categories/:id removes smoke category", async () => {
    runner.assert(categoryId, "missing category id");
    await apiRequest(ctx, `/game-categories/${categoryId}`, {
      method: "DELETE",
      token: admin.accessToken,
      expectStatus: 204,
    });
  });

  return runner.finishPhase();
}
