import crypto from "crypto";

export function generateInvitePassword(): string {
  return crypto.randomBytes(12).toString("base64url");
}
