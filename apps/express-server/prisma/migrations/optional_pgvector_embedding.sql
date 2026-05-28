-- Optional: run manually when pgvector is installed on PostgreSQL
-- e.g. Docker: use pgvector/pgvector:pg16 image
-- Then: psql $DATABASE_URL -f prisma/migrations/optional_pgvector_embedding.sql

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
