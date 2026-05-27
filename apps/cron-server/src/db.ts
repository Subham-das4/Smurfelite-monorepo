import { PrismaClient } from "@smurfelite/types/src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import type { CronConfig } from "./config.js";

let pool: Pool | null = null;
let prisma: PrismaClient | null = null;

export function getPrisma(config: CronConfig): PrismaClient {
  if (!prisma) {
    pool = new Pool({ connectionString: config.databaseUrl });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({
      adapter,
      log: ["error", "warn"],
    });
  }
  return prisma;
}

export async function disconnectDb(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
  if (pool) {
    await pool.end();
    pool = null;
  }
}
