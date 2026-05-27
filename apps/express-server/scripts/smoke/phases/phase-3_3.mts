import { prisma } from "../../../src/lib/prisma.js";
import { buildEnquiryNotificationEmailHtml } from "../../../src/services/email/templates.js";
import { sendEnquiryNotificationEmail } from "../../../src/services/email/transactional.service.js";
import { resetEmailTransportForTests } from "../../../src/services/email.service.js";
import { SmokeRunner, assertIncludes } from "../lib/runner.mts";
import type { SmokeContext } from "../lib/runner.mts";
import { apiRequest } from "../lib/http.mts";

interface EnquiryApiResponse {
  id: string;
  subject: string;
  message: string;
  name: string;
  email: string;
  phone: string | null;
  userId: string | null;
  isClosed: boolean;
}

export async function runPhase3_3(ctx: SmokeContext): Promise<boolean> {
  const runner = new SmokeRunner("Phase 3.3 — Enquiry fix");
  console.log(`\n${"=".repeat(60)}\n${runner.phaseLabel}\n${"=".repeat(60)}`);

  runner.section("Enquiry notification template");

  await runner.test("Enquiry notification template includes contact fields", async () => {
    const html = buildEnquiryNotificationEmailHtml({
      enquiryId: "enq-123",
      name: "Jane Guest",
      email: "jane@example.com",
      phone: "+15551234567",
      message: "I need help with my order.",
      submittedByUserId: null,
    });
    assertIncludes(html, "Jane Guest", "name");
    assertIncludes(html, "jane@example.com", "email");
    assertIncludes(html, "+15551234567", "phone");
    assertIncludes(html, "I need help with my order.", "message");
    assertIncludes(html, "guest", "guest note");
  });

  runner.section("Guest enquiry API");

  const guestPayload = {
    name: "Smoke Guest",
    email: "guest-smoke@example.com",
    phone: "+15550001111",
    message: "Smoke test enquiry message for phase 3.3.",
  };

  let guestEnquiryId: string | undefined;

  await runner.test("POST /enquiries accepts guest submission without auth", async () => {
    resetEmailTransportForTests();

    const { status, data } = await apiRequest<EnquiryApiResponse>(
      ctx,
      "/enquiries",
      {
        method: "POST",
        body: guestPayload,
        expectStatus: 201,
      }
    );

    runner.assert(status === 201, "expected 201");
    runner.assert(data.name === guestPayload.name, "name mismatch");
    runner.assert(data.email === guestPayload.email, "email mismatch");
    runner.assert(data.phone === guestPayload.phone, "phone mismatch");
    runner.assert(data.message === guestPayload.message, "message mismatch");
    runner.assert(data.userId === null, "guest should not have userId");
    runner.assert(data.subject.includes("Smoke Guest"), "subject should include name");
    guestEnquiryId = data.id;
  });

  await runner.test("POST /enquiries rejects invalid payload", async () => {
    await apiRequest(ctx, "/enquiries", {
      method: "POST",
      body: { name: "X", email: "not-an-email", message: "short" },
      expectStatus: 400,
    });
  });

  await runner.test("Authenticated enquiry links userId when token provided", async () => {
    resetEmailTransportForTests();

    const { data } = await apiRequest<EnquiryApiResponse>(ctx, "/enquiries", {
      method: "POST",
      token: ctx.buyerToken,
      body: {
        name: "Smoke Buyer",
        email: "buyer-linked@example.com",
        message: "Authenticated smoke enquiry for phase 3.3.",
      },
      expectStatus: 201,
    });

    runner.assert(data.userId === ctx.buyerId, "expected buyer userId on enquiry");
  });

  runner.section("Enquiry notification email");

  await runner.test("sendEnquiryNotificationEmail uses help sender (mock)", async () => {
    resetEmailTransportForTests();

    const result = await sendEnquiryNotificationEmail({
      enquiryId: guestEnquiryId ?? "unknown",
      name: guestPayload.name,
      email: guestPayload.email,
      phone: guestPayload.phone,
      message: guestPayload.message,
    });

    runner.assert(result.mock === true, "expected mock transport");
    runner.assert(result.messageId.length > 0, "messageId missing");
  });

  await runner.test("Guest enquiry persisted in database", async () => {
    runner.assert(Boolean(guestEnquiryId), "missing guest enquiry id from prior test");

    const row = await prisma.enquiry.findUnique({
      where: { id: guestEnquiryId! },
    });

    runner.assert(Boolean(row), "enquiry row not found");
    runner.assert(row!.email === guestPayload.email, "stored email mismatch");
    runner.assert(row!.userId === null, "stored userId should be null");
  });

  return runner.finishPhase();
}
