import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStoreTransferTimeline1760000014000 implements MigrationInterface {
  name = "AddStoreTransferTimeline1760000014000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE TYPE "store_transfers_status_enum" AS ENUM ('planned', 'exported', 'imported', 'canceled');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "store_transfers"
        ADD COLUMN IF NOT EXISTS "status" "store_transfers_status_enum" NOT NULL DEFAULT 'planned',
        ADD COLUMN IF NOT EXISTS "exportedAt" TIMESTAMPTZ NULL,
        ADD COLUMN IF NOT EXISTS "exporterId" UUID NULL,
        ADD COLUMN IF NOT EXISTS "exporterSnapshot" JSONB NULL,
        ADD COLUMN IF NOT EXISTS "importedAt" TIMESTAMPTZ NULL,
        ADD COLUMN IF NOT EXISTS "importerId" UUID NULL,
        ADD COLUMN IF NOT EXISTS "importerSnapshot" JSONB NULL,
        ADD COLUMN IF NOT EXISTS "canceledAt" TIMESTAMPTZ NULL,
        ADD COLUMN IF NOT EXISTS "cancelerId" UUID NULL,
        ADD COLUMN IF NOT EXISTS "cancelerSnapshot" JSONB NULL;
    `);

    // Các phiếu cũ đã làm thay đổi tồn ở cả hai kho, nên được xem là đã nhập.
    await queryRunner.query(`
      UPDATE "store_transfers"
      SET
        "status" = 'imported',
        "exportedAt" = COALESCE("exportedAt", "occurredAt"),
        "exporterId" = COALESCE("exporterId", "creatorId"),
        "exporterSnapshot" = COALESCE("exporterSnapshot", "creatorSnapshot"),
        "importedAt" = COALESCE("importedAt", "occurredAt"),
        "importerId" = COALESCE("importerId", "creatorId"),
        "importerSnapshot" = COALESCE("importerSnapshot", "creatorSnapshot")
      WHERE "status" = 'planned';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "store_transfers"
        DROP COLUMN IF EXISTS "cancelerSnapshot",
        DROP COLUMN IF EXISTS "cancelerId",
        DROP COLUMN IF EXISTS "canceledAt",
        DROP COLUMN IF EXISTS "importerSnapshot",
        DROP COLUMN IF EXISTS "importerId",
        DROP COLUMN IF EXISTS "importedAt",
        DROP COLUMN IF EXISTS "exporterSnapshot",
        DROP COLUMN IF EXISTS "exporterId",
        DROP COLUMN IF EXISTS "exportedAt",
        DROP COLUMN IF EXISTS "status";
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "store_transfers_status_enum";`);
  }
}
