import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateConversationTable1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create conversations table
    await queryRunner.createTable(
      new Table({
        name: "conversations",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "note",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "deletedAt",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "isDefault",
            type: "boolean",
            default: false,
          },
          {
            name: "conversationId",
            type: "uuid",
            isUnique: true,
          },
          {
            name: "title",
            type: "varchar",
            length: "255",
          },
          {
            name: "userId",
            type: "int",
          },
          {
            name: "lastMessageAt",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "messageCount",
            type: "int",
            default: 0,
          },
        ],
      }),
      true
    );

    // Add foreign key
    await queryRunner.createForeignKey(
      "conversations",
      new TableForeignKey({
        columnNames: ["userId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );

    // Add conversationId column to chatHistories
    await queryRunner.query(`
      ALTER TABLE "chatHistories" 
      ADD COLUMN "conversationId" INT NULL
    `);

    // Migrate existing data
    await queryRunner.query(`
      INSERT INTO "conversations" ("conversationId", "title", "userId", "lastMessageAt", "messageCount", "createdAt")
      SELECT 
        DISTINCT ON (ch."conversationId") 
        ch."conversationId",
        COALESCE(ch."conversationTitle", 'Untitled Conversation'),
        ch."userId",
        MAX(ch."createdAt"),
        COUNT(*),
        MIN(ch."createdAt")
      FROM "chatHistories" ch
      WHERE ch."conversationId" IS NOT NULL
      GROUP BY ch."conversationId", ch."userId", ch."conversationTitle"
    `);

    // Update chatHistories with new conversationId (FK)
    await queryRunner.query(`
      UPDATE "chatHistories" ch
      SET "conversationId" = c.id
      FROM "conversations" c
      WHERE ch."conversationId" = c."conversationId"::text
    `);

    // Drop old columns from chatHistories
    await queryRunner.query(`
      ALTER TABLE "chatHistories" 
      DROP COLUMN "conversationTitle"
    `);

    // Add foreign key
    await queryRunner.createForeignKey(
      "chatHistories",
      new TableForeignKey({
        columnNames: ["conversationId"],
        referencedColumnNames: ["id"],
        referencedTableName: "conversations",
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove FK
    const table = await queryRunner.getTable("chatHistories");
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf("conversationId") !== -1
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey("chatHistories", foreignKey);
    }

    // Restore old columns
    await queryRunner.query(`
      ALTER TABLE "chatHistories" 
      ADD COLUMN "conversationTitle" VARCHAR(255) NULL
    `);

    // Migrate data back
    await queryRunner.query(`
      UPDATE "chatHistories" ch
      SET "conversationTitle" = c.title
      FROM "conversations" c
      WHERE ch."conversationId" = c.id
    `);

    await queryRunner.query(`
      ALTER TABLE "chatHistories" 
      DROP COLUMN "conversationId"
    `);

    // Drop conversations table
    await queryRunner.dropTable("conversations");
  }
}
