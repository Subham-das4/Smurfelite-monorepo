import type { PrismaClient } from "@smurfelite/types/src/generated/prisma/index.js";

/**
 * Run `fn` only if this process acquires the Postgres advisory lock.
 * Prevents duplicate cron runs when multiple instances start by mistake.
 */
export async function withAdvisoryLock<T>(
  prisma: PrismaClient,
  lockId: number,
  fn: () => Promise<T>
): Promise<T | null> {
  const rows = await prisma.$queryRawUnsafe<{ locked: boolean }[]>(
    "SELECT pg_try_advisory_lock($1::bigint) AS locked",
    lockId
  );
  const acquired = rows[0]?.locked === true;
  if (!acquired) {
    return null;
  }

  try {
    return await fn();
  } finally {
    await prisma.$executeRawUnsafe(
      "SELECT pg_advisory_unlock($1::bigint)",
      lockId
    );
  }
}

/** Per-job lock ids derived from base config lock. */
export function jobLockId(baseLockId: number, jobSlot: number): number {
  return baseLockId + jobSlot;
}
