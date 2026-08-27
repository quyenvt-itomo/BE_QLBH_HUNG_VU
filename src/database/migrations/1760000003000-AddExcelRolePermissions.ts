import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExcelRolePermissions1760000003000
  implements MigrationInterface
{
  name = "AddExcelRolePermissions1760000003000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "importExcel" jsonb NOT NULL DEFAULT \'[]\'',
    );
    await queryRunner.query(
      'ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "exportExcel" jsonb NOT NULL DEFAULT \'[]\'',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "roles" DROP COLUMN IF EXISTS "exportExcel"',
    );
    await queryRunner.query(
      'ALTER TABLE "roles" DROP COLUMN IF EXISTS "importExcel"',
    );
  }
}
