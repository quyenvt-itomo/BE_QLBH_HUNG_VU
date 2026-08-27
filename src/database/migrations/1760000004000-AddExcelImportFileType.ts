import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExcelImportFileType1760000004000
  implements MigrationInterface
{
  name = "AddExcelImportFileType1760000004000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DO $$ " +
        "DECLARE enum_name text; " +
        "BEGIN " +
        "SELECT t.typname INTO enum_name " +
        "FROM pg_type t " +
        "JOIN pg_enum e ON e.enumtypid = t.oid " +
        "JOIN pg_attribute a ON a.atttypid = t.oid " +
        "JOIN pg_class c ON c.oid = a.attrelid " +
        "WHERE c.relname = 'files' AND a.attname = 'entityType' " +
        "AND e.enumlabel = 'product' LIMIT 1; " +
        "IF enum_name IS NOT NULL THEN " +
        "EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS %L', enum_name, 'excelImport'); " +
        "END IF; END $$;",
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL does not support removing an enum value safely.
  }
}
