import { OrderStatus } from "../../types/prisma.js";
import { prisma } from "../../lib/prisma.js";
import { decrypt } from "../encryption.service.js";
import logger from "../../utils/logger.js";
import { sendEmail, type SendEmailResult } from "../email.service.js";
import { getEmailSenderProfile } from "../email.config.js";
import {
  buildAdminInviteEmailHtml,
  buildAdminPasswordResetEmailHtml,
  buildPasswordResetEmailHtml,
  buildPurchaseCredentialsEmailHtml,
  buildVerificationEmailHtml,
  buildEnquiryNotificationEmailHtml,
} from "./templates.js";

function getFrontendBase(): string {
  const raw = process.env.FRONTEND_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

function getAdminFrontendBase(): string {
  const raw =
    process.env.ADMIN_FRONTEND_URL?.trim() ||
    process.env.ADMIN_PANEL_URL?.trim() ||
    "http://localhost:5173";
  return raw.replace(/\/$/, "");
}

function getPublicApiBase(): string {
  const port = process.env.PORT?.trim() || "8080";
  const raw =
    process.env.PUBLIC_API_BASE_URL?.trim() ||
    process.env.SMOKE_API_BASE?.trim() ||
    `http://localhost:${port}/api`;
  return raw.replace(/\/$/, "");
}

export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  token: string;
}): Promise<SendEmailResult> {
  const verifyUrl = `${getPublicApiBase()}/auth/verify-email?token=${encodeURIComponent(params.token)}`;
  const html = buildVerificationEmailHtml({
    name: params.name,
    verifyUrl,
  });

  return sendEmail({
    from: "help",
    to: params.to,
    subject: "Verify your SmurfElite account",
    html,
    text: `Hi ${params.name}, verify your email: ${verifyUrl}`,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  token: string;
}): Promise<SendEmailResult> {
  const resetUrl = `${getFrontendBase()}/reset-password?token=${encodeURIComponent(params.token)}`;
  const html = buildPasswordResetEmailHtml({
    name: params.name,
    resetUrl,
  });

  return sendEmail({
    from: "help",
    to: params.to,
    subject: "Reset your SmurfElite password",
    html,
    text: `Hi ${params.name}, reset your password: ${resetUrl}`,
  });
}

export async function sendAdminInviteEmail(params: {
  to: string;
  name: string;
  temporaryPassword: string;
}): Promise<SendEmailResult> {
  const loginUrl = `${getAdminFrontendBase()}/login`;
  const html = buildAdminInviteEmailHtml({
    name: params.name,
    loginUrl,
    temporaryPassword: params.temporaryPassword,
  });

  return sendEmail({
    from: "help",
    to: params.to,
    subject: "Your SmurfElite admin account",
    html,
    text: `Hi ${params.name}, your admin account is ready. Temporary password: ${params.temporaryPassword}. Sign in: ${loginUrl}`,
  });
}

export async function sendAdminPasswordResetEmail(params: {
  to: string;
  name: string;
  token: string;
}): Promise<SendEmailResult> {
  const resetUrl = `${getAdminFrontendBase()}/reset-password?token=${encodeURIComponent(params.token)}`;
  const html = buildAdminPasswordResetEmailHtml({
    name: params.name,
    resetUrl,
  });

  return sendEmail({
    from: "help",
    to: params.to,
    subject: "Reset your SmurfElite admin password",
    html,
    text: `Hi ${params.name}, reset your admin password: ${resetUrl}`,
  });
}

export async function sendPurchaseCredentialsEmail(params: {
  to: string;
  buyerName: string;
  orderId: string;
  credentials: Array<{
    title: string;
    gameType: string;
    accountUsername: string;
    accountPassword: string;
    accountEmail: string;
    accountEmailPassword: string;
  }>;
}): Promise<SendEmailResult> {
  const html = buildPurchaseCredentialsEmailHtml({
    buyerName: params.buyerName,
    orderId: params.orderId,
    credentials: params.credentials,
  });

  return sendEmail({
    from: "purchase",
    to: params.to,
    subject: `Your SmurfElite order credentials — ${params.orderId}`,
    html,
    text: `Your order ${params.orderId} is complete. View credentials in your order history.`,
  });
}

/** Loads a COMPLETED order and emails decrypted credentials to the buyer. */
export async function sendPurchaseCredentialsEmailForOrder(
  orderId: string
): Promise<SendEmailResult | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { select: { email: true, name: true } },
      items: { include: { product: true } },
    },
  });

  if (!order) {
    logger.warn(`Purchase credentials email skipped — order ${orderId} not found`);
    return null;
  }

  if (order.status !== OrderStatus.COMPLETED) {
    logger.warn(
      `Purchase credentials email skipped — order ${orderId} status is ${order.status}`
    );
    return null;
  }

  const credentials = order.items.map((item) => {
    const p = item.product;
    return {
      title: p.title,
      gameType: p.gameType,
      accountUsername: decrypt(Buffer.from(p.accountUsername)),
      accountPassword: decrypt(Buffer.from(p.accountPassword)),
      accountEmail: decrypt(Buffer.from(p.accountEmail)),
      accountEmailPassword: decrypt(Buffer.from(p.accountEmailPassword)),
    };
  });

  const result = await sendPurchaseCredentialsEmail({
    to: order.buyer.email,
    buyerName: order.buyer.name,
    orderId: order.id,
    credentials,
  });

  logger.info(
    `Purchase credentials email sent for order ${orderId} → ${order.buyer.email}`
  );

  return result;
}

export async function sendEnquiryNotificationEmail(params: {
  enquiryId: string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  submittedByUserId?: string | null;
}): Promise<SendEmailResult> {
  const helpProfile = getEmailSenderProfile("help");
  const html = buildEnquiryNotificationEmailHtml(params);
  const phoneLine = params.phone?.trim()
    ? `Phone: ${params.phone.trim()}`
    : "Phone: Not provided";

  const result = await sendEmail({
    from: "help",
    to: helpProfile.address,
    subject: `New enquiry from ${params.name}`,
    html,
    text: [
      `New contact enquiry (${params.enquiryId})`,
      `Name: ${params.name}`,
      `Email: ${params.email}`,
      phoneLine,
      params.submittedByUserId
        ? `User ID: ${params.submittedByUserId}`
        : "Guest submission",
      "",
      params.message,
    ].join("\n"),
  });

  logger.info(
    `Enquiry notification sent for ${params.enquiryId} → ${helpProfile.address}`
  );

  return result;
}
