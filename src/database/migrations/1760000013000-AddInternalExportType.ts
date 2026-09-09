import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInternalExportType1760000013000 implements MigrationInterface {
  name = "AddInternalExportType1760000013000";

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
      ALTER TABLE "internal_exports"
      ADD COLUMN IF NOT EXISTS "type" "internal_exports_type_enum" NOT NULL DEFAULT 'usage'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "internal_exports" DROP COLUMN IF EXISTS "type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "internal_exports_type_enum"`);
  }
}
