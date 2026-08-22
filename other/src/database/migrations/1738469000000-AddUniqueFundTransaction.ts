import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueFundTransaction1738469000000 implements MigrationInterface {
  name = "AddUniqueFundTransaction1738469000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Xóa duplicate trước khi thêm unique constraint
    await queryRunner.query(`
      DELETE FROM fund_transaction ft1
      WHERE ft1.id IN (
        SELECT ft1.id
        FROM fund_transaction ft1
        INNER JOIN fund_transaction ft2 ON
          ft1."refId" = ft2."refId"
          AND ft1."fundId" = ft2."fundId"
          AND ft1."refType" = ft2."refType"
          AND ft1.id > ft2.id
      )
    `);

    // Thêm unique constraint
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_fund_transaction_ref" 
      ON "fund_transaction" ("refId", "fundId", "refType")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_fund_transaction_ref"`);
  }
}
