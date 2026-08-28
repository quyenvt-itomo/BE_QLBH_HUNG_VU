import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * The first Excel permission model stored both partner types under `partner`.
 * Preserve that access when the permissions are split into customer/supplier.
 */
export class SplitPartnerExcelPermissions1760000005000
  implements MigrationInterface
{
  name = "SplitPartnerExcelPermissions1760000005000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "roles"
      SET "importExcel" = COALESCE((
        SELECT jsonb_agg(to_jsonb(module) ORDER BY module)
        FROM (
          SELECT DISTINCT CASE WHEN value = 'partner' THEN 'customer' ELSE value END AS module
          FROM jsonb_array_elements_text(COALESCE("roles"."importExcel", '[]'::jsonb)) AS item(value)
          WHERE value IN ('product', 'customer', 'supplier', 'partner')
          UNION
          SELECT 'supplier'
          WHERE "roles"."importExcel" ? 'partner'
        ) modules
      ), '[]'::jsonb),
      "exportExcel" = COALESCE((
        SELECT jsonb_agg(to_jsonb(module) ORDER BY module)
        FROM (
          SELECT DISTINCT CASE WHEN value = 'partner' THEN 'customer' ELSE value END AS module
          FROM jsonb_array_elements_text(COALESCE("roles"."exportExcel", '[]'::jsonb)) AS item(value)
          WHERE value IN ('product', 'customer', 'supplier', 'partner')
          UNION
          SELECT 'supplier'
          WHERE "roles"."exportExcel" ? 'partner'
        ) modules
      ), '[]'::jsonb)
      WHERE "importExcel" ? 'partner' OR "exportExcel" ? 'partner'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "roles"
      SET "importExcel" = COALESCE((
        SELECT jsonb_agg(to_jsonb(module) ORDER BY module)
        FROM (
          SELECT DISTINCT CASE WHEN value IN ('customer', 'supplier') THEN 'partner' ELSE value END AS module
          FROM jsonb_array_elements_text(COALESCE("importExcel", '[]'::jsonb)) AS item(value)
        ) modules
      ), '[]'::jsonb),
      "exportExcel" = COALESCE((
        SELECT jsonb_agg(to_jsonb(module) ORDER BY module)
        FROM (
          SELECT DISTINCT CASE WHEN value IN ('customer', 'supplier') THEN 'partner' ELSE value END AS module
          FROM jsonb_array_elements_text(COALESCE("exportExcel", '[]'::jsonb)) AS item(value)
        ) modules
      ), '[]'::jsonb)
    `);
  }
}
