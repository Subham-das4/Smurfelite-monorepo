import { prisma } from "../../../src/lib/prisma.js";
import { ensureSellerUser } from "../../../src/lib/prisma.js";
import { WalletLedgerType } from "../../../src/types/prisma.js";
import { fulfillOrder } from "../../../src/modules/orders/fulfillment.service.js";
import { createOrder } from "../../../src/modules/orders/orders.services.js";
import { SmokeRunner } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest, loginAdmin, loginSeller } from "../lib/http.mts";
import { findPurchasableProduct } from "../lib/helpers.mts";

export async function runPhase5_6(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 5.6 — Wallet API");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  await ensureSellerUser();
  const admin = await loginAdmin(ctx.apiBase);
  const seller = await loginSeller(ctx.apiBase);

  runner.section("Seller wallet read");

  await runner.test("GET /wallets/me requires seller role", async () => {
    await apiRequest(ctx, "/wallets/me", {
      token: ctx.buyerToken,
      expectStatus: 403,
    });
  });

  await runner.test("GET /wallets/me returns seller balances", async () => {
    const { data } = await apiRequest<{
      userId: string;
      pendingBalance: number;
      availableBalance: number;
      frozenBalance: number;
    }>(ctx, "/wallets/me", {
      token: seller.accessToken,
      expectStatus: 200,
    });
    runner.assert(data.userId === seller.userId, "userId mismatch");
    runner.assert(typeof data.pendingBalance === "number", "pendingBalance");
  });

  runner.section("Wallet auto-create & sale credit");

  await runner.test("Promoting to seller ensures wallet exists", async () => {
    const email = `smoke-wallet-buyer-${Date.now()}@test.com`;
    const reg = await apiRequest<{ user: { id: string; role: string } }>(
      ctx,
      "/auth/register",
      {
        method: "POST",
        body: {
          email,
          password: "testpass123",
          name: "Smoke Wallet Buyer",
        },
        expectStatus: 201,
      }
    );
    runner.assert(reg.data.user.role === "BUYER", "registered as BUYER");

    const { data } = await apiRequest<{ id: string; role: string }>(
      ctx,
      `/users/${reg.data.user.id}/promote-seller`,
      {
        method: "PATCH",
        token: admin.accessToken,
        expectStatus: 200,
      }
    );
    runner.assert(data.role === "SELLER", "promoted to SELLER");

    const wallet = await prisma.sellerWallet.findUnique({
      where: { userId: reg.data.user.id },
    });
    runner.assert(wallet, "wallet created on promote-seller");

    await prisma.verificationToken.deleteMany({
      where: { userId: reg.data.user.id },
    });
    await prisma.sellerWallet.deleteMany({ where: { userId: reg.data.user.id } });
    await prisma.user.delete({ where: { id: reg.data.user.id } });
  });

  await runner.test("Fulfillment credits pendingBalance on completed sale", async () => {
    const product = await findPurchasableProduct();
    runner.assert(product, "no purchasable product");

    const walletBefore = await prisma.sellerWallet.findUnique({
      where: { userId: product!.sellerId },
    });
    const pendingBefore = walletBefore ? Number(walletBefore.pendingBalance) : 0;

    const order = await createOrder(ctx.buyerId, [product!.id]);
    await fulfillOrder(order.id, "smoke-5.6");

    const walletAfter = await prisma.sellerWallet.findUnique({
      where: { userId: product!.sellerId },
    });
    runner.assert(walletAfter, "wallet exists after first sale");
    runner.assert(
      Number(walletAfter!.pendingBalance) > pendingBefore,
      "pendingBalance increased after sale"
    );
  });

  runner.section("Admin payout");

  await runner.test("POST /wallets/:sellerId/payout records manual payout", async () => {
    const wallet = await prisma.sellerWallet.upsert({
      where: { userId: seller.userId },
      create: {
        userId: seller.userId,
        pendingBalance: 0,
        availableBalance: 25,
        frozenBalance: 0,
      },
      update: {
        availableBalance: 25,
      },
    });

    const { data } = await apiRequest<{ availableBalance: number }>(
      ctx,
      `/wallets/${seller.userId}/payout`,
      {
        method: "POST",
        token: admin.accessToken,
        body: { amount: 10, note: "smoke payout" },
        expectStatus: 200,
      }
    );

    runner.assert(
      Number(data.availableBalance) === Number(wallet.availableBalance) - 10,
      "availableBalance decreased"
    );

    const ledger = await prisma.walletLedger.findFirst({
      where: {
        walletUserId: seller.userId,
        type: WalletLedgerType.PAYOUT,
      },
      orderBy: { createdAt: "desc" },
    });
    runner.assert(ledger && ledger.amount === 10, "PAYOUT ledger entry");
  });

  return runner.finishPhase();
}
