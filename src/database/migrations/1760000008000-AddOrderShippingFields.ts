import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderShippingFields1760000008000 implements MigrationInterface {
  name = "AddOrderShippingFields1760000008000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingFee" numeric(15,2) NULL DEFAULT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "isFreeShipping" boolean NOT NULL DEFAULT true',
    );
    await queryRunner.query(
      'UPDATE "orders" SET "isFreeShipping" = true WHERE "isFreeShipping" IS NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "orders" ALTER COLUMN "isFreeShipping" SET DEFAULT true',
    );
    await queryRunner.query(
      'ALTER TABLE "orders" ALTER COLUMN "isFreeShipping" SET NOT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "orders" DROP COLUMN IF EXISTS "isFreeShipping"',
    );
    await queryRunner.query(
      'ALTER TABLE "orders" DROP COLUMN IF EXISTS "shippingFee"',
    );
  }
}
