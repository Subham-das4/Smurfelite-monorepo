import { SmokeRunner } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest } from "../lib/http.mts";
import { findPurchasableProduct } from "../lib/helpers.mts";

interface ProductDetailResponse {
  id: string;
  title: string;
  status: string;
  isAvailable: boolean;
  reviews?: unknown;
  reviewCount?: unknown;
  overallRating?: unknown;
}

/** Phase 4.3 is mostly frontend; these API checks guard the product detail contract. */
export async function runPhase4_3(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 4.3 — Product detail (API contract)");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  runner.section("Product detail API (no mock reviews)");

  await runner.test("GET /products/:id returns a public product shape", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "No purchasable product for detail contract test");

    const { status, data } = await apiRequest<ProductDetailResponse>(
      ctx,
      `/products/${product!.id}`,
      { expectStatus: 200 }
    );

    runner.assert(status === 200, "expected 200");
    runner.assert(data.id === product!.id, "id mismatch");
    runner.assert(typeof data.title === "string" && data.title.length > 0, "title missing");
    runner.assert(data.status === "ACTIVE", "expected ACTIVE status");
    runner.assert(data.isAvailable === true, "expected isAvailable true");
  });

  await runner.test("Product API does not expose mock review fields", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "No purchasable product");

    const { data } = await apiRequest<Record<string, unknown>>(
      ctx,
      `/products/${product!.id}`,
      { expectStatus: 200 }
    );

    runner.assert(!("reviews" in data), "reviews should not be on product API");
    runner.assert(!("reviewCount" in data), "reviewCount should not be on product API");
    runner.assert(!("overallRating" in data), "overallRating should not be on product API");
  });

  return runner.finishPhase();
}
