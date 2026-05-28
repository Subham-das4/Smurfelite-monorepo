-- Backfill guest contact fields on existing enquiries before NOT NULL constraints.

ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "phone" TEXT;

UPDATE "Enquiry" AS e
SET
  "name" = COALESCE(u."name", 'Unknown'),
  "email" = COALESCE(u."email", 'legacy@example.com')
FROM "User" AS u
WHERE e."userId" = u."id"
  AND (e."name" IS NULL OR e."email" IS NULL);

UPDATE "Enquiry"
SET
  "name" = COALESCE("name", 'Unknown'),
  "email" = COALESCE("email", 'legacy@example.com')
WHERE "name" IS NULL OR "email" IS NULL;

ALTER TABLE "Enquiry" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "Enquiry" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "Enquiry" ALTER COLUMN "userId" DROP NOT NULL;
