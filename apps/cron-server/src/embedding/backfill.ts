import type { PrismaClient } from "@smurfelite/types/src/generated/prisma/index.js";
import type { Logger } from "winston";
import type { CronConfig } from "../config.js";
import { productHasEmbeddingColumn } from "./capabilities.js";
import { fetchOpenAiEmbeddings } from "./provider.js";
import { buildProductEmbeddingText } from "./text.js";

type ProductCandidate = {
  id: string;
  title: string;
  description: string | null;
  specifications: unknown;
  gameType: string;
};

export async function backfillProductEmbeddings(
  prisma: PrismaClient,
  config: CronConfig,
  logger: Logger
): Promise<{ processed: number; skippedJob: boolean; reason?: string }> {
  const hasColumn = await productHasEmbeddingColumn(prisma);
  if (!hasColumn) {
    return {
      processed: 0,
      skippedJob: true,
      reason:
        "Product.embedding column not found — run optional pgvector migration first",
    };
  }

  const apiKey = config.embeddingProviderApiKey;
  if (!apiKey) {
    return {
      processed: 0,
      skippedJob: true,
      reason: "EMBEDDING_PROVIDER_API_KEY not set",
    };
  }

  const candidates = await prisma.$queryRawUnsafe<ProductCandidate[]>(
    `SELECT id, title, description, specifications, "gameType"
     FROM "Product"
     WHERE embedding IS NULL
       AND status = 'ACTIVE'
       AND "deletedAt" IS NULL
     ORDER BY "createdAt" ASC
     LIMIT $1`,
    config.embeddingBatchSize
  );

  if (candidates.length === 0) {
    return { processed: 0, skippedJob: false };
  }

  const texts = candidates.map(buildProductEmbeddingText);
  const vectors = await fetchOpenAiEmbeddings(
    apiKey,
    config.embeddingModel,
    texts
  );

  let processed = 0;
  for (let i = 0; i < candidates.length; i += 1) {
    const product = candidates[i]!;
    const vector = vectors[i];
    if (!vector?.length) {
      logger.warn(`embedding-backfill: empty vector for product ${product.id}`);
      continue;
    }

    const vectorLiteral = `[${vector.join(",")}]`;
    await prisma.$executeRawUnsafe(
      `UPDATE "Product" SET embedding = $1::vector WHERE id = $2`,
      vectorLiteral,
      product.id
    );
    processed += 1;
    logger.info(`embedding-backfill: stored embedding for product ${product.id}`);
  }

  return { processed, skippedJob: false };
}
