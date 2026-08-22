import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddTotalsToInventoryAdjustment20260206084311 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Thêm 2 columns vào bảng inventory_adjustments
    await queryRunner.addColumn(
      "inventory_adjustments",
      new TableColumn({
        name: "totalAdjustmentQty",
        type: "float8",
        isNullable: true,
        default: 0,
      }),
    );

    await queryRunner.addColumn(
      "inventory_adjustments",
      new TableColumn({
        name: "totalAdjustmentValue",
        type: "float8",
        isNullable: true,
        default: 0,
      }),
    );

    // Tính toán giá trị cho các records hiện tại
    await queryRunner.query(`
      UPDATE inventory_adjustments ia
      SET 
        "totalAdjustmentQty" = COALESCE((
          SELECT SUM(
            ial."deltaQty" * 
            CASE 
              WHEN ial.direction = 'in' THEN 1 
              ELSE -1 
            END
          )
          FROM inventory_adjustment_lines ial
          WHERE ial."adjustmentId" = ia.id
            AND ial."deletedAt" IS NULL
        ), 0),
        "totalAdjustmentValue" = COALESCE((
          SELECT SUM(
            ial."deltaQty" * 
            ial."costPriceAtTime" * 
            CASE 
              WHEN ial.direction = 'in' THEN 1 
              ELSE -1 
            END
          )
          FROM inventory_adjustment_lines ial
          WHERE ial."adjustmentId" = ia.id
            AND ial."deletedAt" IS NULL
        ), 0)
      WHERE ia."deletedAt" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("inventory_adjustments", "totalAdjustmentQty");
    await queryRunner.dropColumn(
      "inventory_adjustments",
      "totalAdjustmentValue",
    );
  }
}
