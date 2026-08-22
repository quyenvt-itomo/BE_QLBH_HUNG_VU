import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity } from "typeorm";
import {
  LoyaltyPointTransactionTypeEnum,
  LoyaltyPointRefTypeEnum,
} from "@/shared/constants/enum";

/**
 * Loyalty Point Transaction
 * Lịch sử giao dịch điểm tích lũy
 */
@Entity("loyalty_point_transactions")
export class LoyaltyPointTransaction extends BaseEntity {
  @Column({ type: "timestamptz" })
  occurredAt!: Date;

  @Column({ type: "uuid" })
  partnerId!: string;

  @Column({
    type: "enum",
    enum: LoyaltyPointTransactionTypeEnum,
  })
  type!: LoyaltyPointTransactionTypeEnum; // INCREASE | DECREASE

  @Column(BaseNumericColumnOptions)
  points!: number; // Số điểm (luôn dương, tăng/giảm do type quy định)

  @Column({ type: "enum", enum: LoyaltyPointRefTypeEnum })
  refType!: LoyaltyPointRefTypeEnum; // ORDER | ADJUSTMENT

  @Column({ type: "uuid" })
  refId!: string;

  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  refCode!: string | null;

  // ===== ACCUMULATED STATE (Cache để tính toán nhanh) =====

  @Column(BaseNumericColumnOptions)
  revenueChange!: number; // Biến động doanh thu trong giao dịch này

  @Column(BaseNumericColumnOptions)
  accumulatedRevenue!: number; // Tổng doanh thu tích lũy SAU transaction này

  @Column(BaseNumericColumnOptions)
  revenueForPointsMilestone!: number; // Mốc doanh thu đã tính điểm = floor(accumulatedRevenue/rate)*rate

  @Column(BaseNumericColumnOptions)
  pointEarnRate!: number; // Tỷ lệ tích điểm tại thời điểm transaction (lưu lại để audit)
}
