import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPartnerPersonalAndContactIdentity1760000006000
  implements MigrationInterface
{
  name = "AddPartnerPersonalAndContactIdentity1760000006000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "gender" varchar(20) NULL DEFAULT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "dob" timestamptz NULL DEFAULT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "partner_contacts" ADD COLUMN IF NOT EXISTS "identityCode" varchar(20) NULL DEFAULT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "partner_contacts" DROP COLUMN IF EXISTS "identityCode"',
    );
    await queryRunner.query(
      'ALTER TABLE "partners" DROP COLUMN IF EXISTS "dob"',
    );
    await queryRunner.query(
      'ALTER TABLE "partners" DROP COLUMN IF EXISTS "gender"',
    );
  }
}
