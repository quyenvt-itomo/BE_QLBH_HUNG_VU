import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductDescription1760000001000 implements MigrationInterface {
  name = "AddProductDescription1760000001000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "description" text NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "description"`,
    );
  }
}
