import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInternalExports1760000012000 implements MigrationInterface {
  name = "AddInternalExports1760000012000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'internal_exports_type_enum') THEN
          CREATE TYPE "internal_exports_type_enum" AS ENUM ('damaged', 'usage');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_transactions_reftype_enum')
          AND NOT EXISTS (
            SELECT 1 FROM pg_enum
            WHERE enumtypid = 'inventory_transactions_reftype_enum'::regtype
              AND enumlabel = 'internal_export'
          ) THEN
          ALTER TYPE "inventory_transactions_reftype_enum" ADD VALUE 'internal_export';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "internal_exports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tempId" uuid NULL DEFAULT NULL,
        "note" text NULL,
        "creatorId" uuid NULL,
        "creatorSnapshot" jsonb NULL,
        "updaterId" uuid NULL,
        "updaterSnapshot" jsonb NULL,
        "deleterId" uuid NULL,
        "deleterSnapshot" jsonb NULL,
        "sortOrder" numeric(10,4) NOT NULL DEFAULT 10,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NULL DEFAULT NULL,
        "deletedAt" timestamptz NULL,
        "isDefault" boolean NOT NULL DEFAULT false,
        "storeId" uuid NOT NULL,
        "type" "internal_exports_type_enum" NOT NULL DEFAULT 'usage',
        "occurredAt" timestamptz NOT NULL DEFAULT now(),
        "code" varchar(50) NOT NULL,
        "reason" text NULL,
        CONSTRAINT "PK_internal_exports_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_internal_exports_store" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`ALTER TABLE "internal_exports" ADD COLUMN IF NOT EXISTS "type" "internal_exports_type_enum" NOT NULL DEFAULT 'usage'`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_internal_exports_store" ON "internal_exports" ("storeId", "occurredAt")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_internal_exports_store_code" ON "internal_exports" ("storeId", "code") WHERE "deletedAt" IS NULL`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "internal_export_lines" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tempId" uuid NULL DEFAULT NULL,
        "note" text NULL,
        "creatorId" uuid NULL,
        "creatorSnapshot" jsonb NULL,
        "updaterId" uuid NULL,
        "updaterSnapshot" jsonb NULL,
        "deleterId" uuid NULL,
        "deleterSnapshot" jsonb NULL,
        "sortOrder" numeric(10,4) NOT NULL DEFAULT 10,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NULL DEFAULT NULL,
        "deletedAt" timestamptz NULL,
        "isDefault" boolean NOT NULL DEFAULT false,
        "internalExportId" uuid NOT NULL,
        "productId" uuid NULL,
        "productSnapshot" jsonb NULL,
        "unitId" uuid NULL,
        "unitSnapshot" jsonb NULL,
        "conversionRateAtTime" numeric(18,6) NOT NULL DEFAULT 1,
        "quantity" numeric(18,6) NOT NULL DEFAULT 0,
        CONSTRAINT "PK_internal_export_lines_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_internal_export_lines_export" FOREIGN KEY ("internalExportId") REFERENCES "internal_exports"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_internal_export_lines_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_internal_export_lines_export" ON "internal_export_lines" ("internalExportId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_internal_export_lines_product" ON "internal_export_lines" ("productId")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "internal_export_lines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "internal_exports"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "internal_exports_type_enum"`);
  }
}
