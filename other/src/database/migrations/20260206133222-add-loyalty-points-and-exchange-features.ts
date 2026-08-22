import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  Table,
  TableForeignKey,
} from "typeorm";

export class AddLoyaltyPointsAndExchangeFeatures20260206133222 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ===== 1. Thêm lineType vào order_lines =====
    await queryRunner.addColumn(
      "order_lines",
      new TableColumn({
        name: "lineType",
        type: "varchar",
        default: "'normal'",
      }),
    );

    // ===== 2. Thêm loyalty points fields vào orders =====
    await queryRunner.addColumn(
      "orders",
      new TableColumn({
        name: "pointEarnRate",
        type: "float8",
        isNullable: true,
        default: 100000,
      }),
    );

    await queryRunner.addColumn(
      "orders",
      new TableColumn({
        name: "pointRedeemRate",
        type: "float8",
        isNullable: true,
        default: 10000,
      }),
    );

    await queryRunner.addColumn(
      "orders",
      new TableColumn({
        name: "loyaltyPointsUsed",
        type: "float8",
        isNullable: true,
        default: 0,
      }),
    );

    await queryRunner.addColumn(
      "orders",
      new TableColumn({
        name: "loyaltyPointsDiscountAmount",
        type: "float8",
        isNullable: true,
        default: null,
      }),
    );

    await queryRunner.addColumn(
      "orders",
      new TableColumn({
        name: "loyaltyPointsEarned",
        type: "float8",
        isNullable: true,
        default: 0,
      }),
    );

    // ===== 3. Thêm loyalty points fields vào partners =====
    await queryRunner.addColumn(
      "partners",
      new TableColumn({
        name: "loyaltyPoints",
        type: "float8",
        isNullable: true,
        default: 0,
      }),
    );

    await queryRunner.addColumn(
      "partners",
      new TableColumn({
        name: "totalRevenue",
        type: "float8",
        isNullable: true,
        default: 0,
      }),
    );

    // ===== 4. Tạo bảng loyalty_point_transactions =====
    await queryRunner.createTable(
      new Table({
        name: "loyalty_point_transactions",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "tempId",
            type: "varchar",
            isNullable: true,
            default: null,
          },
          {
            name: "note",
            type: "text",
            isNullable: true,
            default: null,
          },
          {
            name: "createdAt",
            type: "timestamptz",
            default: "now()",
          },
          {
            name: "updatedAt",
            type: "timestamptz",
            default: "now()",
          },
          {
            name: "deletedAt",
            type: "timestamptz",
            isNullable: true,
            default: null,
          },
          {
            name: "isDefault",
            type: "boolean",
            default: false,
          },
          {
            name: "partnerId",
            type: "uuid",
          },
          {
            name: "orderId",
            type: "uuid",
            isNullable: true,
            default: null,
          },
          {
            name: "orderCode",
            type: "varchar",
            isNullable: true,
            default: null,
          },
          {
            name: "occurredAt",
            type: "timestamptz",
          },
          {
            name: "type",
            type: "varchar",
          },
          {
            name: "points",
            type: "float8",
          },
          {
            name: "balanceBefore",
            type: "float8",
          },
          {
            name: "balanceAfter",
            type: "float8",
          },
          {
            name: "revenueAmount",
            type: "float8",
            isNullable: true,
            default: null,
          },
          {
            name: "totalRevenueBefore",
            type: "float8",
            isNullable: true,
            default: null,
          },
          {
            name: "totalRevenueAfter",
            type: "float8",
            isNullable: true,
            default: null,
          },
          {
            name: "pointEarnRate",
            type: "float8",
            isNullable: true,
            default: null,
          },
          {
            name: "pointRedeemRate",
            type: "float8",
            isNullable: true,
            default: null,
          },
        ],
      }),
      true,
    );

    // Tạo foreign keys cho loyalty_point_transactions
    await queryRunner.createForeignKey(
      "loyalty_point_transactions",
      new TableForeignKey({
        columnNames: ["partnerId"],
        referencedTableName: "partners",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    await queryRunner.createForeignKey(
      "loyalty_point_transactions",
      new TableForeignKey({
        columnNames: ["orderId"],
        referencedTableName: "orders",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      }),
    );

    // Tạo indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_loyalty_point_transactions_partnerId" 
      ON "loyalty_point_transactions" ("partnerId");
      
      CREATE INDEX "IDX_loyalty_point_transactions_orderId" 
      ON "loyalty_point_transactions" ("orderId");
      
      CREATE INDEX "IDX_loyalty_point_transactions_occurredAt" 
      ON "loyalty_point_transactions" ("occurredAt");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_loyalty_point_transactions_partnerId";
      DROP INDEX IF EXISTS "IDX_loyalty_point_transactions_orderId";
      DROP INDEX IF EXISTS "IDX_loyalty_point_transactions_occurredAt";
    `);

    // Drop table
    await queryRunner.dropTable("loyalty_point_transactions");

    // Drop columns from partners
    await queryRunner.dropColumn("partners", "totalRevenue");
    await queryRunner.dropColumn("partners", "loyaltyPoints");

    // Drop columns from orders
    await queryRunner.dropColumn("orders", "loyaltyPointsEarned");
    await queryRunner.dropColumn("orders", "loyaltyPointsDiscountAmount");
    await queryRunner.dropColumn("orders", "loyaltyPointsUsed");
    await queryRunner.dropColumn("orders", "pointRedeemRate");
    await queryRunner.dropColumn("orders", "pointEarnRate");

    // Drop column from order_lines
    await queryRunner.dropColumn("order_lines", "lineType");
  }
}
