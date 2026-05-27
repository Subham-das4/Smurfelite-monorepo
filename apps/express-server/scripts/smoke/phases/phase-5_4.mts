import { ensureSellerUser } from "../../../src/lib/prisma.js";
import { SmokeRunner } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest, loginAdmin, loginSeller } from "../lib/http.mts";

interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: string;
  lastLoginAt?: string | null;
}

interface UserDetail {
  id: string;
  email: string;
  lastLoginAt: string | null;
  cart: { items: unknown[] } | null;
  orders: unknown[];
  products: unknown[];
  _count: { orders: number; products: number };
}

export async function runPhase5_4(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 5.4 — Users (admin API)");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  await ensureSellerUser();
  const admin = await loginAdmin(ctx.apiBase);
  const seller = await loginSeller(ctx.apiBase);

  runner.section("Search & list");

  await runner.test("GET /users requires admin", async () => {
    await apiRequest(ctx, "/users", {
      token: ctx.buyerToken,
      expectStatus: 403,
    });
  });

  await runner.test("GET /users?search= finds buyer by email", async () => {
    const { data } = await apiRequest<{ users: UserListItem[] }>(
      ctx,
      "/users?search=buyer@buyer.com",
      {
        token: admin.accessToken,
        expectStatus: 200,
      }
    );
    runner.assert(Array.isArray(data.users), "users array expected");
    runner.assert(
      data.users.some((u) => u.email === "buyer@buyer.com"),
      "buyer@buyer.com should match email search"
    );
  });

  await runner.test("GET /users?search=buyer filters by email/name", async () => {
    const { data } = await apiRequest<{ users: UserListItem[] }>(
      ctx,
      "/users?search=buyer",
      {
        token: admin.accessToken,
        expectStatus: 200,
      }
    );
    runner.assert(
      data.users.every(
        (u) =>
          u.email.toLowerCase().includes("buyer") ||
          u.name.toLowerCase().includes("buyer")
      ),
      "all results should match search term"
    );
  });

  runner.section("User detail");

  await runner.test("GET /users/:id returns detail with cart, orders, lastLoginAt", async () => {
    const { data } = await apiRequest<UserDetail>(ctx, `/users/${ctx.buyerId}`, {
      token: admin.accessToken,
      expectStatus: 200,
    });
    runner.assert(data.id === ctx.buyerId, "id mismatch");
    runner.assert(typeof data.email === "string", "email missing");
    runner.assert("lastLoginAt" in data, "lastLoginAt field expected");
    runner.assert(data.cart !== undefined, "cart relation expected");
    runner.assert(Array.isArray(data.orders), "orders array expected");
    runner.assert(typeof data._count?.orders === "number", "orders count expected");
  });

  runner.section("Seller products");

  await runner.test("GET /users/:id/products returns seller listings", async () => {
    const { data } = await apiRequest<{
      user: { id: string; role: string };
      products: { id: string; title: string }[];
      meta: { totalCount: number };
    }>(ctx, `/users/${seller.userId}/products`, {
      token: admin.accessToken,
      expectStatus: 200,
    });
    runner.assert(data.user.id === seller.userId, "user id mismatch");
    runner.assert(Array.isArray(data.products), "products array expected");
    runner.assert(typeof data.meta.totalCount === "number", "meta.totalCount expected");
  });

  return runner.finishPhase();
}
