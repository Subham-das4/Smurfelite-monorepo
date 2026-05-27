import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer/index.js";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import ApiError from "../utils/errors.js";
import logger from "../utils/logger.js";
import {
  getEmailSenderProfile,
  getSenderSmtpCredentials,
  getSmtpConnectionOptions,
  isSenderSmtpConfigured,
  isSmtpHostConfigured,
  isValidEmailSenderKey,
  type EmailSenderKey,
  type SendEmailInput,
  type SendEmailResult,
} from "./email.config.js";

export {
  getEmailModuleStatus,
  getEmailSenderProfile,
  getSenderSmtpCredentials,
  isSenderSmtpConfigured,
  isSmtpConfigured,
  isSmtpHostConfigured,
  isValidEmailSenderKey,
  type EmailSenderKey,
  type EmailModuleStatus,
  type SendEmailInput,
  type SendEmailResult,
} from "./email.config.js";

type MailTransport = Mail<any>;

const transports = new Map<EmailSenderKey, MailTransport>();
let mockTransport: MailTransport | null = null;

function createMockTransport(): MailTransport {
  if (!mockTransport) {
    logger.warn(
      "SMTP_HOST is not set — email.service using JSON mock transport (dev/smoke only)."
    );
    mockTransport = nodemailer.createTransport({ jsonTransport: true });
  }
  return mockTransport;
}

function createSenderTransport(from: EmailSenderKey): MailTransport {
  const connection = getSmtpConnectionOptions();
  if (!connection) {
    return createMockTransport();
  }

  const auth = getSenderSmtpCredentials(from);
  if (!auth) {
    throw new ApiError(
      `SMTP credentials are not configured for sender "${from}". Set EMAIL_${from.toUpperCase()}_USER and EMAIL_${from.toUpperCase()}_PASS.`,
      500
    );
  }

  const options: SMTPTransport.Options = {
    ...connection,
    auth,
  };

  return nodemailer.createTransport(options);
}

function getTransportForSender(from: EmailSenderKey): MailTransport {
  if (!isSmtpHostConfigured()) {
    return createMockTransport();
  }

  let transport = transports.get(from);
  if (!transport) {
    transport = createSenderTransport(from);
    transports.set(from, transport);
  }
  return transport;
}

/** Reset cached transports (useful in tests after env changes). */
export function resetEmailTransportForTests(): void {
  transports.clear();
  mockTransport = null;
}

function normalizeRecipients(to: string | string[]): string {
  const list = Array.isArray(to) ? to : [to];
  const trimmed = list.map((e) => e.trim()).filter(Boolean);
  if (trimmed.length === 0) {
    throw new ApiError("Email recipient (to) is required.", 400);
  }
  return trimmed.join(", ");
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!isValidEmailSenderKey(input.from)) {
    throw new ApiError(`Invalid email sender: ${input.from}`, 400);
  }

  const sender = getEmailSenderProfile(input.from);
  const to = normalizeRecipients(input.to);
  const mock = !isSenderSmtpConfigured(input.from);

  const info = await getTransportForSender(input.from).sendMail({
    from: `"${sender.name}" <${sender.address}>`,
    to,
    subject: input.subject,
    html: input.html,
    ...(input.text ? { text: input.text } : {}),
  });

  logger.info(
    `Email sent (${input.from} → ${to}, mock=${mock}): ${info.messageId ?? "n/a"}`
  );

  return {
    messageId: info.messageId ?? "",
    mock,
  };
}
