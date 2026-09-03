import { MigrationInterface, QueryRunner } from "typeorm";

export class RenamePartnerAddressesToAddress1760000009000
  implements MigrationInterface
{
  name = "RenamePartnerAddressesToAddress1760000009000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasAddresses = await queryRunner.hasColumn("partners", "addresses");
    const hasAddress = await queryRunner.hasColumn("partners", "address");

    if (hasAddresses && !hasAddress) {
      await queryRunner.query(
        'ALTER TABLE "partners" RENAME COLUMN "addresses" TO "address"',
      );
    } else if (!hasAddress) {
      await queryRunner.query(
        'ALTER TABLE "partners" ADD COLUMN "address" jsonb NULL DEFAULT NULL',
      );
    }

    // Keep the first saved address when upgrading the old array shape.
    await queryRunner.query(
      `UPDATE "partners"
       SET "address" = CASE
         WHEN jsonb_typeof("address") = 'array' THEN COALESCE(
           (SELECT item
            FROM jsonb_array_elements("address") AS item
            WHERE item ->> 'isPermanent' = 'true'
            LIMIT 1),
           "address" -> 0,
           '{}'::jsonb)
         ELSE "address"
       END
       WHERE "address" IS NOT NULL`,
    );

    await queryRunner.query(
      'ALTER TABLE "partners" ALTER COLUMN "address" SET DEFAULT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasAddresses = await queryRunner.hasColumn("partners", "addresses");
    const hasAddress = await queryRunner.hasColumn("partners", "address");

    if (hasAddress && !hasAddresses) {
      await queryRunner.query(
        `UPDATE "partners"
         SET "address" = CASE
           WHEN "address" IS NULL THEN '[]'::jsonb
           ELSE jsonb_build_array("address")
         END`,
      );
      await queryRunner.query(
        'ALTER TABLE "partners" RENAME COLUMN "address" TO "addresses"',
      );
      await queryRunner.query(
        'ALTER TABLE "partners" ALTER COLUMN "addresses" SET DEFAULT \'[]\'::jsonb',
      );
    }
  }
}
