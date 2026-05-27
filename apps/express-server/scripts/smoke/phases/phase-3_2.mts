import {
  buildPasswordResetEmailHtml,
  buildPurchaseCredentialsEmailHtml,
  buildVerificationEmailHtml,
} from "../../../src/services/email/templates.js";
import {
  sendPasswordResetEmail,
  sendPurchaseCredentialsEmailForOrder,
  sendVerificationEmail,
} from "../../../src/services/email/transactional.service.js";
import { fulfillOrder } from "../../../src/modules/orders/fulfillment.service.js";
import { createOrder } from "../../../src/modules/orders/orders.services.js";
import { resetEmailTransportForTests } from "../../../src/services/email.service.js";
import { SmokeRunner, assertIncludes } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest } from "../lib/http.mts";
import { findPurchasableProduct } from "../lib/helpers.mts";

export async function runPhase3_2(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 3.2 — Transactional emails");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  runner.section("HTML templates");

  await runner.test("Verification template includes verify link", async () => {
    const html = buildVerificationEmailHtml({
      name: "Test User",
      verifyUrl: "http://localhost:8080/api/auth/verify-email?token=abc123",
    });
    assertIncludes(html, "Verify your email", "title");
    assertIncludes(html, "verify-email?token=abc123", "verify url");
    assertIncludes(html, "Test User", "name");
  });

  await runner.test("Password reset template includes reset link", async () => {
    const html = buildPasswordResetEmailHtml({
      name: "Buyer",
      resetUrl: "http://localhost:3000/reset-password?token=xyz",
    });
    assertIncludes(html, "Reset your password", "title");
    assertIncludes(html, "reset-password?token=xyz", "reset url");
  });

  await runner.test("Purchase credentials template includes account fields", async () => {
    const html = buildPurchaseCredentialsEmailHtml({
      buyerName: "Buyer",
      orderId: "order-123",
      credentials: [
        {
          title: "Test Account",
          gameType: "VALORANT",
          accountUsername: "user1",
          accountPassword: "pass1",
          accountEmail: "acc@test.com",
          accountEmailPassword: "emailpass",
        },
      ],
    });
    assertIncludes(html, "order-123", "order id");
    assertIncludes(html, "user1", "username");
    assertIncludes(html, "acc@test.com", "account email");
  });

  runner.section("Transactional send helpers");

  await runner.test("sendVerificationEmail uses help sender (mock)", async () => {
    resetEmailTransportForTests();
    const result = await sendVerificationEmail({
      to: "verify-smoke@example.com",
      name: "Smoke User",
      token: "test-token-123",
    });
    runner.assert(result.mock === true, "expected mock transport");
    runner.assert(result.messageId.length > 0, "messageId missing");
  });

  await runner.test("sendPasswordResetEmail uses help sender (mock)", async () => {
    resetEmailTransportForTests();
    const result = await sendPasswordResetEmail({
      to: "reset-smoke@example.com",
      name: "Smoke User",
      token: "reset-token-456",
    });
    runner.assert(result.mock === true, "expected mock transport");
    runner.assert(result.messageId.length > 0, "messageId missing");
  });

  await runner.test("POST /auth/forgot-password triggers without error", async () => {
    const { data } = await apiRequest<{ message?: string }>(
      ctx,
      "/auth/forgot-password",
      {
        method: "POST",
        body: { email: "buyer@buyer.com" },
        expectStatus: 200,
      }
    );
    runner.assert(
      typeof data.message === "string" && data.message.length > 0,
      "forgot-password should return message"
    );
  });

  runner.section("Order fulfillment credentials email");

  await runner.test("fulfillOrder sends purchase credentials email", async () => {
    resetEmailTransportForTests();

    const product = await findPurchasableProduct();
    runner.assert(product, "No purchasable product for credentials email test");

    const order = await createOrder(ctx.buyerId, [product!.id]);
    await fulfillOrder(order.id, "smoke-3.2");

    const result = await sendPurchaseCredentialsEmailForOrder(order.id);
    runner.assert(result !== null, "credentials email should be sendable for COMPLETED order");
    runner.assert(result!.mock === true, "expected mock transport");
    runner.assert(result!.messageId.length > 0, "messageId missing");
  });

  return runner.finishPhase();
}
