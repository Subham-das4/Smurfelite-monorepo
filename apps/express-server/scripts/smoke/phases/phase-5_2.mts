import { prisma } from "../../../src/lib/prisma.js";
import { SmokeRunner } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest, loginAdmin, loginSeller } from "../lib/http.mts";

const SMOKE_SLUG_PREFIX = "smoke-5-2-";

interface Game {
  id: string;
  name: string;
  slug: string;
  isRestricted: boolean;
}

interface Platform {
  id: string;
  name: string;
  slug: string;
  isRestricted: boolean;
}

export async function runPhase5_2(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 5.2 — Games & platforms (admin API)");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  const admin = await loginAdmin(ctx.apiBase);
  const seller = await loginSeller(ctx.apiBase);

  const slug = `${SMOKE_SLUG_PREFIX}${Date.now()}`;
  let gameId: string | undefined;
  let platformId: string | undefined;

  runner.section("Public read");

  await runner.test("GET /games returns 200", async () => {
    const { status, data } = await apiRequest<{ games: Game[] }>(
      ctx,
      "/games",
      { expectStatus: 200 }
    );
    runner.assert(status === 200, "expected 200");
    runner.assert(Array.isArray(data.games), "games array expected");
  });

  await runner.test("GET /platforms returns 200", async () => {
    const { status, data } = await apiRequest<{ platforms: Platform[] }>(
      ctx,
      "/platforms",
      { expectStatus: 200 }
    );
    runner.assert(status === 200, "expected 200");
    runner.assert(Array.isArray(data.platforms), "platforms array expected");
    runner.assert(data.platforms.length > 0, "expected seeded platforms");
    platformId = data.platforms[0].id;
  });

  runner.section("Admin CRUD — games");

  await runner.test("POST /games requires admin", async () => {
    await apiRequest(ctx, "/games", {
      method: "POST",
      token: seller.accessToken,
      body: { name: "Blocked Game" },
      expectStatus: 403,
    });
  });

  await runner.test("POST /games creates game", async () => {
    const { data } = await apiRequest<Game>(ctx, "/games", {
      method: "POST",
      token: admin.accessToken,
      body: { name: "Smoke Test Game", slug },
      expectStatus: 201,
    });
    runner.assert(data.slug === slug, "slug mismatch");
    runner.assert(data.isRestricted === false, "default not restricted");
    gameId = data.id;
  });

  await runner.test("GET /games/:id returns game", async () => {
    runner.assert(gameId, "missing game id");
    const { data } = await apiRequest<Game>(ctx, `/games/${gameId}`, {
      expectStatus: 200,
    });
    runner.assert(data.id === gameId, "id mismatch");
  });

  await runner.test("PATCH /games/:id/restrict toggles restriction", async () => {
    runner.assert(gameId, "missing game id");
    const { data } = await apiRequest<Game>(ctx, `/games/${gameId}/restrict`, {
      method: "PATCH",
      token: admin.accessToken,
      body: {},
      expectStatus: 200,
    });
    runner.assert(data.isRestricted === true, "expected restricted after toggle");
  });

  runner.section("Block listings in restricted games");

  await runner.test("POST /products in restricted gameId is rejected", async () => {
    runner.assert(gameId, "missing game id");
    runner.assert(platformId, "missing platform id");
    await apiRequest(ctx, "/products", {
      method: "POST",
      token: seller.accessToken,
      body: {
        gameId,
        platformId,
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

  await runner.test("PATCH /games/:id/restrict un-restricts game", async () => {
    runner.assert(gameId, "missing game id");
    const { data } = await apiRequest<Game>(ctx, `/games/${gameId}/restrict`, {
      method: "PATCH",
      token: admin.accessToken,
      body: { isRestricted: false },
      expectStatus: 200,
    });
    runner.assert(data.isRestricted === false, "expected unrestricted");
  });

  await runner.test("POST /products allowed after game unrestricted", async () => {
    runner.assert(gameId, "missing game id");
    runner.assert(platformId, "missing platform id");
    const { data } = await apiRequest<{ id: string; status: string }>(ctx, "/products", {
      method: "POST",
      token: seller.accessToken,
      body: {
        gameId,
        platformId,
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

  await runner.test("DELETE /games/:id removes smoke game", async () => {
    runner.assert(gameId, "missing game id");
    await apiRequest(ctx, `/games/${gameId}`, {
      method: "DELETE",
      token: admin.accessToken,
      expectStatus: 204,
    });
  });

  return runner.finishPhase();
}
