import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderInvoiceNumber1760000010000 implements MigrationInterface {
  name = "AddOrderInvoiceNumber1760000010000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoiceNumber" varchar(100) NULL DEFAULT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "orders" DROP COLUMN IF EXISTS "invoiceNumber"',
    );
  }
}
