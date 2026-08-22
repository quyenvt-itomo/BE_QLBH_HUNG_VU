import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { LoyaltyPointTransactionTypeEnum } from "@/shared/constants/enum";
import { Partner } from "./Partner";

/**
 * Loyalty Point Adjustment
 * Lịch sử giao dịch điểm tích lũy
 */
@Entity("loyalty_point_adjustments")
export class LoyaltyPointAdjustment extends BaseEntity {
  @Column({ type: "varchar" })
  code!: string;

  @Column({ type: "timestamptz" })
  occurredAt!: Date;

  @Column({ type: "uuid" })
  partnerId!: string;

  @Column({
    type: "enum",
    enum: LoyaltyPointTransactionTypeEnum,
  })
  direction!: LoyaltyPointTransactionTypeEnum; // INCREASE | DECREASE

  @Column(BaseNumericColumnOptions)
  expectedRevenue!: number; // Doanh số hệ thống ghi nhận

  @Column(BaseNumericColumnOptions)
  countedRevenue!: number; // Doanh số thực tế kiểm kê

  @Column(BaseNumericColumnOptions)
  expectedPoints!: number; // số tiền hệ thống ghi nhận

  @Column(BaseNumericColumnOptions)
  countedPoints!: number; // số tiền thực tế kiểm kê

  @Column(BaseNumericColumnOptions)
  deltaPoints!: number;

  @Column({ type: "text" })
  reason!: string;

  @Column({ type: "boolean", default: false })
  isInitialAdjustment!: boolean; // là phiếu điều chỉnh điểm đầu kỳ

  // * ======================== RELATIONS ========================= //
  @ManyToOne(() => Partner, (partner) => partner.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "partnerId" })
  partner!: Partner;
}
