import {
  getEmailModuleStatus,
  getEmailSenderProfile,
  isSmtpConfigured,
  resetEmailTransportForTests,
  sendEmail,
} from "../../../src/services/email.service.js";
import { SmokeRunner, assertEq } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest } from "../lib/http.mts";

export async function runPhase3_1(_ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 3.1 — SMTP module");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  runner.section("Sender configuration");

  await runner.test("Default sender profiles are configured", async () => {
    const help = getEmailSenderProfile("help");
    const finance = getEmailSenderProfile("finance");
    const purchase = getEmailSenderProfile("purchase");

    runner.assert(help.address.includes("@"), "help address missing");
    runner.assert(finance.address.includes("@"), "finance address missing");
    runner.assert(purchase.address.includes("@"), "purchase address missing");
    runner.assert(help.name.length > 0, "help name missing");
    runner.assert(finance.name.length > 0, "finance name missing");
    runner.assert(purchase.name.length > 0, "purchase name missing");
    runner.assert(
      typeof help.credentialsConfigured === "boolean",
      "credentialsConfigured missing on help"
    );
  });

  await runner.test("GET /email/status returns module status", async () => {
    const { data } = await apiRequest<{
      smtpConfigured: boolean;
      mockTransport: boolean;
      senders: {
        help: { address: string; name: string; credentialsConfigured: boolean };
        finance: { address: string; name: string; credentialsConfigured: boolean };
        purchase: { address: string; name: string; credentialsConfigured: boolean };
      };
    }>(_ctx, "/email/status", { expectStatus: 200 });

    runner.assert(typeof data.smtpConfigured === "boolean", "smtpConfigured missing");
    runner.assert(typeof data.mockTransport === "boolean", "mockTransport missing");
    runner.assert(data.senders.help?.address, "help sender missing");
    runner.assert(data.senders.finance?.address, "finance sender missing");
    runner.assert(data.senders.purchase?.address, "purchase sender missing");
    runner.assert(
      data.senders.help.credentialsConfigured === false,
      "help credentials should be unset in smoke env"
    );
    assertEq(data.mockTransport, !isSmtpConfigured(), "mockTransport matches env");
  });

  runner.section("sendEmail helper");

  await runner.test("sendEmail delivers via mock transport when SMTP unset", async () => {
    resetEmailTransportForTests();
    const status = getEmailModuleStatus();
    runner.assert(status.mockTransport, "expected mock transport in smoke env");

    const result = await sendEmail({
      from: "help",
      to: "smoke-test@example.com",
      subject: "SmurfElite smoke test",
      html: "<p>Phase 3.1 SMTP module smoke test.</p>",
      text: "Phase 3.1 SMTP module smoke test.",
    });

    runner.assert(result.mock === true, "sendEmail should report mock=true without SMTP");
    runner.assert(result.messageId.length > 0, "messageId should be returned");
  });

  await runner.test("sendEmail supports purchase and finance senders", async () => {
    resetEmailTransportForTests();

    const purchase = await sendEmail({
      from: "purchase",
      to: "buyer@example.com",
      subject: "Order confirmation",
      html: "<p>Thanks for your purchase.</p>",
    });
    runner.assert(purchase.messageId.length > 0, "purchase sender send failed");

    const finance = await sendEmail({
      from: "finance",
      to: "finance-receipt@example.com",
      subject: "Payout notice",
      html: "<p>Finance notification.</p>",
    });
    runner.assert(finance.messageId.length > 0, "finance sender send failed");
  });

  await runner.test("sendEmail rejects empty recipient", async () => {
    resetEmailTransportForTests();
    let threw = false;
    try {
      await sendEmail({
        from: "help",
        to: "   ",
        subject: "Invalid",
        html: "<p>Nope</p>",
      });
    } catch (err) {
      threw = true;
      runner.assert(
        err instanceof Error && err.message.includes("recipient"),
        "expected recipient validation error"
      );
    }
    runner.assert(threw, "empty recipient should throw");
  });

  return runner.finishPhase();
}
