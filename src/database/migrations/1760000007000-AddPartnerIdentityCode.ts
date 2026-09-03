import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPartnerIdentityCode1760000007000 implements MigrationInterface {
  name = "AddPartnerIdentityCode1760000007000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "identityCode" varchar(20) NULL DEFAULT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "partners" DROP COLUMN IF EXISTS "identityCode"',
    );
  }
}
