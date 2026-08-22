import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddSoftDeleteColumns1734567890123 implements MigrationInterface {
  name = "AddSoftDeleteColumns1734567890123";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add deleted_at column to users table
    await queryRunner.addColumn(
      "users",
      new TableColumn({
        name: "deleted_at",
        type: "timestamp",
        isNullable: true,
        default: null,
      })
    );

    // Add deleted_at column to comments table
    await queryRunner.addColumn(
      "comments",
      new TableColumn({
        name: "deleted_at",
        type: "timestamp",
        isNullable: true,
        default: null,
      })
    );

    // Rename existing columns to snake_case for consistency
    // Users table
    const userColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = current_schema()
    `);

    const existingUserColumns = userColumns.map((row: any) => row.column_name);

    if (existingUserColumns.includes("firstName") && !existingUserColumns.includes("first_name")) {
      await queryRunner.renameColumn("users", "firstName", "first_name");
    }
    if (existingUserColumns.includes("lastName") && !existingUserColumns.includes("last_name")) {
      await queryRunner.renameColumn("users", "lastName", "last_name");
    }
    if (existingUserColumns.includes("isActive") && !existingUserColumns.includes("is_active")) {
      await queryRunner.renameColumn("users", "isActive", "is_active");
    }
    if (existingUserColumns.includes("refreshToken") && !existingUserColumns.includes("refresh_token")) {
      await queryRunner.renameColumn("users", "refreshToken", "refresh_token");
    }
    if (existingUserColumns.includes("createdAt") && !existingUserColumns.includes("created_at")) {
      await queryRunner.renameColumn("users", "createdAt", "created_at");
    }
    if (existingUserColumns.includes("updatedAt") && !existingUserColumns.includes("updated_at")) {
      await queryRunner.renameColumn("users", "updatedAt", "updated_at");
    }

    // Comments table
    const commentColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'comments' AND table_schema = current_schema()
    `);

    const existingCommentColumns = commentColumns.map((row: any) => row.column_name);

    if (existingCommentColumns.includes("parentId") && !existingCommentColumns.includes("parent_id")) {
      await queryRunner.renameColumn("comments", "parentId", "parent_id");
    }
    if (existingCommentColumns.includes("userId") && !existingCommentColumns.includes("user_id")) {
      await queryRunner.renameColumn("comments", "userId", "user_id");
    }
    if (existingCommentColumns.includes("isActive") && !existingCommentColumns.includes("is_active")) {
      await queryRunner.renameColumn("comments", "isActive", "is_active");
    }
    if (existingCommentColumns.includes("createdAt") && !existingCommentColumns.includes("created_at")) {
      await queryRunner.renameColumn("comments", "createdAt", "created_at");
    }
    if (existingCommentColumns.includes("updatedAt") && !existingCommentColumns.includes("updated_at")) {
      await queryRunner.renameColumn("comments", "updatedAt", "updated_at");
    }

    // Create indexes for better performance
    await queryRunner.query(`CREATE INDEX "IDX_users_deleted_at" ON "users" ("deleted_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_comments_deleted_at" ON "comments" ("deleted_at")`);

    // Create partial indexes for active records (where deleted_at IS NULL)
    await queryRunner.query(`CREATE INDEX "IDX_users_active" ON "users" ("id") WHERE "deleted_at" IS NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_comments_active" ON "comments" ("id") WHERE "deleted_at" IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_deleted_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_comments_deleted_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_comments_active"`);

    // Remove deleted_at columns
    await queryRunner.dropColumn("users", "deleted_at");
    await queryRunner.dropColumn("comments", "deleted_at");

    // Revert column names back to camelCase (if needed)
    const userColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = current_schema()
    `);

    const existingUserColumns = userColumns.map((row: any) => row.column_name);

    if (existingUserColumns.includes("first_name")) {
      await queryRunner.renameColumn("users", "first_name", "firstName");
    }
    if (existingUserColumns.includes("last_name")) {
      await queryRunner.renameColumn("users", "last_name", "lastName");
    }
    if (existingUserColumns.includes("is_active")) {
      await queryRunner.renameColumn("users", "is_active", "isActive");
    }
    if (existingUserColumns.includes("refresh_token")) {
      await queryRunner.renameColumn("users", "refresh_token", "refreshToken");
    }
    if (existingUserColumns.includes("created_at")) {
      await queryRunner.renameColumn("users", "created_at", "createdAt");
    }
    if (existingUserColumns.includes("updated_at")) {
      await queryRunner.renameColumn("users", "updated_at", "updatedAt");
    }

    // Comments table
    const commentColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'comments' AND table_schema = current_schema()
    `);

    const existingCommentColumns = commentColumns.map((row: any) => row.column_name);

    if (existingCommentColumns.includes("parent_id")) {
      await queryRunner.renameColumn("comments", "parent_id", "parentId");
    }
    if (existingCommentColumns.includes("user_id")) {
      await queryRunner.renameColumn("comments", "user_id", "userId");
    }
    if (existingCommentColumns.includes("is_active")) {
      await queryRunner.renameColumn("comments", "is_active", "isActive");
    }
    if (existingCommentColumns.includes("created_at")) {
      await queryRunner.renameColumn("comments", "created_at", "createdAt");
    }
    if (existingCommentColumns.includes("updated_at")) {
      await queryRunner.renameColumn("comments", "updated_at", "updatedAt");
    }
  }
}
