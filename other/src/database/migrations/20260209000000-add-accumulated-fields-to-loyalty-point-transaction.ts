import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddAccumulatedFieldsToLoyaltyPointTransaction20260209000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Thêm các trường accumulated state để tính toán nhanh
    await queryRunner.addColumn(
      "loyalty_point_transactions",
      new TableColumn({
        name: "revenueChange",
        type: "float8",
        default: 0,
        comment: "Biến động doanh thu trong giao dịch này",
      }),
    );

    await queryRunner.addColumn(
      "loyalty_point_transactions",
      new TableColumn({
        name: "accumulatedRevenue",
        type: "float8",
        default: 0,
        comment: "Tổng doanh thu tích lũy SAU transaction này",
      }),
    );

    await queryRunner.addColumn(
      "loyalty_point_transactions",
      new TableColumn({
        name: "revenueForPointsMilestone",
        type: "float8",
        default: 0,
        comment:
          "Mốc doanh thu đã tính điểm = floor(accumulatedRevenue/rate)*rate",
      }),
    );

    await queryRunner.addColumn(
      "loyalty_point_transactions",
      new TableColumn({
        name: "pointEarnRate",
        type: "float8",
        default: 100000,
        comment: "Tỷ lệ tích điểm tại thời điểm transaction",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("loyalty_point_transactions", "pointEarnRate");
    await queryRunner.dropColumn(
      "loyalty_point_transactions",
      "revenueForPointsMilestone",
    );
    await queryRunner.dropColumn(
      "loyalty_point_transactions",
      "accumulatedRevenue",
    );
    await queryRunner.dropColumn("loyalty_point_transactions", "revenueChange");
  }
}
