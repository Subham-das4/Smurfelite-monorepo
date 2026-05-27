import * as PrismaNamespace from "../types/prisma.js";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import { createCart } from "../modules/cart/cart.service.js";

const globalForPrisma = global as unknown as {
  prisma: PrismaNamespace.PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

const pool = new Pool({ connectionString: databaseUrl });

const adapter = new PrismaPg(pool);

// Instantiate the client or use the existing global instance
export const prisma =
  globalForPrisma.prisma ||
  new PrismaNamespace.PrismaClient({
    // Optional: Log database queries for debugging/performance analysis
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    adapter: adapter,
  });

// In development, attach the client to the global object to keep it alive
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Export the client for use in controllers and services
export default prisma;

// Ensure at least one admin user exists
export async function ensureAdminUser() {
  if (process.env.NODE_ENV === "production") return; // Skip in production
  const admin = await prisma.user.findFirst({
    where: { role: PrismaNamespace.Role.ADMIN },
  });

  if (!admin) {
    const hashedPassword = await bcrypt.hash(
      process.env.DEFAULT_ADMIN_PASSWORD || "admin123",
      12
    );
    await prisma.user.create({
      data: {
        email: process.env.DEFAULT_ADMIN_EMAIL || "admin@admin.com",
        password: hashedPassword,
        role: PrismaNamespace.Role.ADMIN,
        isVerified: true,
        name: "Default Admin",
      },
    });
  }
}

export async function ensureBuyerUser() {
  if (process.env.NODE_ENV === "production") return; // Skip in production
  const buyer = await prisma.user.findFirst({
    where: { role: PrismaNamespace.Role.BUYER },
  });
  if (!buyer) {
    const user = await prisma.user.create({
      data: {
        email: process.env.DEFAULT_BUYER_EMAIL || "buyer@buyer.com",
        password: await bcrypt.hash(process.env.DEFAULT_BUYER_PASSWORD || "buyer123", 12),
        role: PrismaNamespace.Role.BUYER,
        isVerified: true,
        name: "Default Buyer",
      },
    });
    await createCart(user.id);
  }
}

export async function ensureSellerUser() {
  if (process.env.NODE_ENV === "production") return;
  const email = process.env.DEFAULT_SELLER_EMAIL || "seller@seller.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(
          process.env.DEFAULT_SELLER_PASSWORD || "seller123",
          12
        ),
        role: PrismaNamespace.Role.SELLER,
        isVerified: true,
        name: "Default Seller",
      },
    });
  }
}