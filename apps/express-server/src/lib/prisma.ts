import * as PrismaNamespace from "@smurfelite/types/src/generated/prisma/index.js"; // Import from the monorepo shared package!
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

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
