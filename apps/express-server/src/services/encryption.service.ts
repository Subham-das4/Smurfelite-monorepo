// apps/express-server/src/services/encryption.service.ts
import * as crypto from "crypto";

// The critical key for AES-256 encryption/decryption
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error("FATAL: ENCRYPTION_KEY must be set in the environment.");
}

const IV_LENGTH = 16; // AES standard Initialization Vector length

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  // The key must be 32 bytes (256 bits) for AES-256
  throw new Error(
    "FATAL: ENCRYPTION_KEY must be a 32-byte string set in the environment."
  );
}

export function encrypt(text: string): Buffer {
  // 1. Generate a random Initialization Vector (IV)
  const iv = crypto.randomBytes(IV_LENGTH);

  // 2. Create the cipher object
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY!, "utf8"),
    iv
  );

  // 3. Encrypt the text
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // 4. Combine the IV and encrypted data (separated by a dot)
  // We convert this string back to a Buffer before returning it for storage as BYTEA in Prisma
  const combinedString = iv.toString("hex") + ":" + encrypted;
  return Buffer.from(combinedString, "utf8");
}

export function decrypt(encryptedBuffer: Buffer): string {
  // 1. Convert the buffer back to the combined IV:encrypted string
  const combinedString = encryptedBuffer.toString("utf8");

  // 2. Split the IV and encrypted data
  const parts = combinedString.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted format.");
  }
  const iv = Buffer.from(parts[0], "hex"); // The Initialization Vector
  const encryptedText = parts[1]; // The encrypted data

  // 3. Create the decipher object
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY!, "utf8"),
    iv
  );

  // 4. Decrypt the text
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
