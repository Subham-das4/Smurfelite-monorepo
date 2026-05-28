-- Create Game table
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");

-- Create Platform table
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Platform_slug_key" ON "Platform"("slug");

-- Migrate GameCategory data into Game
INSERT INTO "Game" ("id", "name", "slug", "isRestricted", "createdAt")
SELECT "id", "name", "slug", "isRestricted", "createdAt" FROM "GameCategory";

-- Seed default platforms
INSERT INTO "Platform" ("id", "name", "slug", "isRestricted", "createdAt") VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Steam', 'steam', false, CURRENT_TIMESTAMP),
  ('a0000000-0000-4000-8000-000000000002', 'Riot Games', 'riot-games', false, CURRENT_TIMESTAMP),
  ('a0000000-0000-4000-8000-000000000003', 'Epic Games', 'epic-games', false, CURRENT_TIMESTAMP);

-- Add new Product columns
ALTER TABLE "Product" ADD COLUMN "gameId" TEXT;
ALTER TABLE "Product" ADD COLUMN "platformId" TEXT;
ALTER TABLE "Product" ADD COLUMN "platform" TEXT;

-- Migrate gameCategoryId to gameId
UPDATE "Product" SET "gameId" = "gameCategoryId" WHERE "gameCategoryId" IS NOT NULL;

-- Drop legacy GameCategory relation
ALTER TABLE "Product" DROP CONSTRAINT "Product_gameCategoryId_fkey";
ALTER TABLE "Product" DROP COLUMN "gameCategoryId";

-- Add new foreign keys
ALTER TABLE "Product" ADD CONSTRAINT "Product_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop GameCategory table
DROP TABLE "GameCategory";
