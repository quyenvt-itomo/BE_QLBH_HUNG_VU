-- Schema migration: move funds into store scope

BEGIN;

ALTER TABLE funds
ADD COLUMN IF NOT EXISTS "storeId" uuid;

UPDATE funds
SET "storeId" = '3ffe9929-4598-451e-a58d-79ae8f41e99f'
WHERE "storeId" IS NULL;

ALTER TABLE funds
ALTER COLUMN "storeId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'FK_funds_store'
  ) THEN
    ALTER TABLE funds
    ADD CONSTRAINT "FK_funds_store"
    FOREIGN KEY ("storeId") REFERENCES stores(id)
    ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IDX_funds_storeId" ON funds ("storeId");

WITH ranked_funds AS (
  SELECT
    f.id,
    ROW_NUMBER() OVER (
      PARTITION BY f."storeId"
      ORDER BY CASE WHEN f."isDefault" THEN 0 ELSE 1 END, f."createdAt" ASC
    ) AS rn
  FROM funds f
  WHERE f."deletedAt" IS NULL
)
UPDATE funds f
SET "isDefault" = CASE WHEN rf.rn = 1 THEN true ELSE false END
FROM ranked_funds rf
WHERE f.id = rf.id;

-- Ensure only one default fund per store (excluding soft-deleted records)
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_funds_store_default_active"
ON funds ("storeId")
WHERE "isDefault" = true AND "deletedAt" IS NULL;

COMMIT;
