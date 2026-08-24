import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductBrandId1760000000000 implements MigrationInterface {
  name = "AddProductBrandId1760000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "brandId" uuid
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_brandId"
      ON "products" ("brandId")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_products_brandId_attributes'
        ) THEN
          ALTER TABLE "products"
          ADD CONSTRAINT "FK_products_brandId_attributes"
          FOREIGN KEY ("brandId") REFERENCES "attributes"("id")
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP CONSTRAINT IF EXISTS "FK_products_brandId_attributes"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_products_brandId"
    `);
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN IF EXISTS "brandId"
    `);
  }
}
