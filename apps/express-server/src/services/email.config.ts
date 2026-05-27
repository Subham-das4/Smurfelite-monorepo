export type EmailSenderKey = "purchase" | "help" | "finance";

export interface EmailSenderProfile {
  address: string;
  name: string;
  /** True when this sender has SMTP user + pass configured. */
  credentialsConfigured: boolean;
}

export interface SendEmailInput {
  from: EmailSenderKey;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  messageId: string;
  mock: boolean;
}

export interface EmailModuleStatus {
  smtpConfigured: boolean;
  mockTransport: boolean;
  senders: Record<EmailSenderKey, EmailSenderProfile>;
}

const DEFAULT_SENDERS: Record<
  EmailSenderKey,
  Pick<EmailSenderProfile, "address" | "name">
> = {
  finance: {
    address: "finance@smurfelite.store",
    name: "SmurfElite Finance",
  },
  help: {
    address: "help@smurfelite.store",
    name: "SmurfElite Support",
  },
  purchase: {
    address: "purchase@smurfelite.store",
    name: "SmurfElite Purchases",
  },
};

const SENDER_ENV: Record<
  EmailSenderKey,
  { addressKey: string; nameKey: string; userKey: string; passKey: string }
> = {
  finance: {
    addressKey: "EMAIL_FINANCE_ADDRESS",
    nameKey: "EMAIL_FINANCE_NAME",
    userKey: "EMAIL_FINANCE_USER",
    passKey: "EMAIL_FINANCE_PASS",
  },
  help: {
    addressKey: "EMAIL_HELP_ADDRESS",
    nameKey: "EMAIL_HELP_NAME",
    userKey: "EMAIL_HELP_USER",
    passKey: "EMAIL_HELP_PASS",
  },
  purchase: {
    addressKey: "EMAIL_PURCHASE_ADDRESS",
    nameKey: "EMAIL_PURCHASE_NAME",
    userKey: "EMAIL_PURCHASE_USER",
    passKey: "EMAIL_PURCHASE_PASS",
  },
};

function getSmtpConnectionOptions() {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;

  const port = Number.parseInt(process.env.SMTP_PORT?.trim() || "587", 10);
  const secure =
    process.env.SMTP_SECURE?.trim().toLowerCase() === "true" || port === 465;

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
  };
}

export function isSmtpHostConfigured(): boolean {
  return Boolean(getSmtpConnectionOptions());
}

export function getSenderSmtpCredentials(
  from: EmailSenderKey
): { user: string; pass: string } | null {
  const envKeys = SENDER_ENV[from];
  const user = process.env[envKeys.userKey]?.trim();
  const pass = process.env[envKeys.passKey]?.trim();

  if (!user || !pass) return null;
  return { user, pass };
}

export function isSenderSmtpConfigured(from: EmailSenderKey): boolean {
  return isSmtpHostConfigured() && getSenderSmtpCredentials(from) !== null;
}

/** @deprecated Use isSmtpHostConfigured — kept for smoke/API compatibility. */
export function isSmtpConfigured(): boolean {
  return isSmtpHostConfigured();
}

export function getEmailSenderProfile(from: EmailSenderKey): EmailSenderProfile {
  const defaults = DEFAULT_SENDERS[from];
  const envKeys = SENDER_ENV[from];

  const address = process.env[envKeys.addressKey]?.trim() || defaults.address;
  const name = process.env[envKeys.nameKey]?.trim() || defaults.name;

  return {
    address,
    name,
    credentialsConfigured: getSenderSmtpCredentials(from) !== null,
  };
}

export function getEmailModuleStatus(): EmailModuleStatus {
  const hostConfigured = isSmtpHostConfigured();
  const senders = {
    finance: getEmailSenderProfile("finance"),
    help: getEmailSenderProfile("help"),
    purchase: getEmailSenderProfile("purchase"),
  };

  const anySenderReady = Object.values(senders).some(
    (s) => s.credentialsConfigured
  );

  return {
    smtpConfigured: hostConfigured && anySenderReady,
    mockTransport: !hostConfigured,
    senders,
  };
}

export function isValidEmailSenderKey(value: string): value is EmailSenderKey {
  return value === "purchase" || value === "help" || value === "finance";
}

export { getSmtpConnectionOptions };
