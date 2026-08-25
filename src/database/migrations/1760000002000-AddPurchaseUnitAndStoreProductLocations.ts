import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPurchaseUnitAndStoreProductLocations1760000002000
  implements MigrationInterface
{
  name = "AddPurchaseUnitAndStoreProductLocations1760000002000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_extra_units"
      ADD COLUMN IF NOT EXISTS "isPurchaseUnit" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "store_product_locations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "storeProductId" uuid NOT NULL,
        "locationId" uuid NULL,
        CONSTRAINT "PK_store_product_locations_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_store_product_locations_store_product_location"
      ON "store_product_locations" ("storeProductId", "locationId")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_store_product_locations_store_product'
        ) THEN
          ALTER TABLE "store_product_locations"
          ADD CONSTRAINT "FK_store_product_locations_store_product"
          FOREIGN KEY ("storeProductId") REFERENCES "store_products"("id")
          ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_store_product_locations_attribute'
        ) THEN
          ALTER TABLE "store_product_locations"
          ADD CONSTRAINT "FK_store_product_locations_attribute"
          FOREIGN KEY ("locationId") REFERENCES "attributes"("id")
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      INSERT INTO "store_product_locations" ("storeProductId", "locationId")
      SELECT "id", "locationId"
      FROM "store_products"
      WHERE "locationId" IS NOT NULL
      ON CONFLICT ("storeProductId", "locationId") DO NOTHING
    `);

    await queryRunner.query(`
      ALTER TABLE "store_products" DROP CONSTRAINT IF EXISTS "FK_store_products_locationId_attributes"
    `);
    await queryRunner.query(`
      ALTER TABLE "store_products" DROP COLUMN IF EXISTS "locationId"
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "store_products"
      ADD COLUMN IF NOT EXISTS "locationId" uuid NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_store_products_location_attributes'
        ) THEN
          ALTER TABLE "store_products"
          ADD CONSTRAINT "FK_store_products_location_attributes"
          FOREIGN KEY ("locationId") REFERENCES "attributes"("id")
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      UPDATE "store_products" sp
      SET "locationId" = locations."locationId"
      FROM (
        SELECT DISTINCT ON ("storeProductId") "storeProductId", "locationId"
        FROM "store_product_locations"
        WHERE "locationId" IS NOT NULL
        ORDER BY "storeProductId", "id"
      ) locations
      WHERE sp."id" = locations."storeProductId"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "store_product_locations"
    `);
    await queryRunner.query(`
      ALTER TABLE "product_extra_units" DROP COLUMN IF EXISTS "isPurchaseUnit"
    `);
  }
}
