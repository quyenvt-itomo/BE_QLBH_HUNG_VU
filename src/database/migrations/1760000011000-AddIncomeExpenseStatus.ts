import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIncomeExpenseStatus1760000011000 implements MigrationInterface {
  name = "AddIncomeExpenseStatus1760000011000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "income_expenses_status_enum" AS ENUM ('draft', 'completed', 'canceled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "income_expenses"
      ADD COLUMN IF NOT EXISTS "status" "income_expenses_status_enum"
      NOT NULL DEFAULT 'completed'
    `);
    await queryRunner.query(`
      UPDATE "income_expenses" incomeExpense
      SET "status" = CASE orderEntity."status"
        WHEN 'completed' THEN 'completed'::"income_expenses_status_enum"
        WHEN 'canceled' THEN 'canceled'::"income_expenses_status_enum"
        ELSE 'draft'::"income_expenses_status_enum"
      END
      FROM "orders" orderEntity
      WHERE incomeExpense."orderId" = orderEntity."id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "income_expenses" DROP COLUMN IF EXISTS "status"',
    );
    await queryRunner.query(
      'DROP TYPE IF EXISTS "income_expenses_status_enum"',
    );
  }
}
