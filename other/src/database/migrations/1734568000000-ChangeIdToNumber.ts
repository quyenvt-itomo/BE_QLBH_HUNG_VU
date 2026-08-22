import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeIdToNumber1734568000000 implements MigrationInterface {
  name = "ChangeIdToNumber1734568000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop ALL foreign key constraints first
    await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "FK_comments_user_id"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "FK_comments_parent_id"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "FK_4c675567d2a58f0b07cef09c13d"`);

    // Drop ALL indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_comments_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_comments_parent_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_deleted_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_comments_deleted_at"`);

    // Clear existing data completely
    await queryRunner.query(`TRUNCATE TABLE "comments" CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE "users" CASCADE`);

    // Change column types from UUID to SERIAL/INTEGER
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id" CASCADE`);
    await queryRunner.query(`ALTER TABLE "users" ADD "id" SERIAL PRIMARY KEY`);

    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "id" CASCADE`);
    await queryRunner.query(`ALTER TABLE "comments" ADD "id" SERIAL PRIMARY KEY`);
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "user_id" CASCADE`);
    await queryRunner.query(`ALTER TABLE "comments" ADD "user_id" INTEGER NOT NULL`);
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "parent_id" CASCADE`);
    await queryRunner.query(`ALTER TABLE "comments" ADD "parent_id" INTEGER`);
    await queryRunner.query(`ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "replies_count" INTEGER DEFAULT 0`);

    // Recreate foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_comments_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_comments_parent_id" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    // Recreate indexes
    await queryRunner.query(`CREATE INDEX "IDX_users_deleted_at" ON "users" ("deleted_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_active" ON "users" ("id") WHERE "deleted_at" IS NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_comments_user_id" ON "comments" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_comments_parent_id" ON "comments" ("parent_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_comments_deleted_at" ON "comments" ("deleted_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_user_id"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_parent_id"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_users_deleted_at"`);
    await queryRunner.query(`DROP INDEX "IDX_users_active"`);
    await queryRunner.query(`DROP INDEX "IDX_comments_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_comments_parent_id"`);
    await queryRunner.query(`DROP INDEX "IDX_comments_deleted_at"`);

    // Clear data
    await queryRunner.query(`DELETE FROM "comments"`);
    await queryRunner.query(`DELETE FROM "users"`);

    // Change back to UUID
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4()`);

    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "comments" ADD "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4()`);
    await queryRunner.query(`ALTER TABLE "comments" ALTER COLUMN "user_id" TYPE UUID USING user_id::uuid`);
    await queryRunner.query(`ALTER TABLE "comments" ALTER COLUMN "parent_id" TYPE UUID USING parent_id::uuid`);

    // Recreate foreign keys for UUID
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_comments_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_comments_parent_id" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
