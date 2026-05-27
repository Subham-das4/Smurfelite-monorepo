import type { PrismaClient } from "@smurfelite/types/src/generated/prisma/index.js";

export async function productHasEmbeddingColumn(
  prisma: PrismaClient
): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Product'
        AND column_name = 'embedding'
    ) AS "exists"
  `;
  return rows[0]?.exists === true;
}
