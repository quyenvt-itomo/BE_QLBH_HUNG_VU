import { MigrationInterface, QueryRunner } from "typeorm";

export class EnableUnaccentExtension1737691000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable unaccent extension for Vietnamese text search without diacritics
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop unaccent extension
    await queryRunner.query(`DROP EXTENSION IF EXISTS unaccent;`);
  }
}
