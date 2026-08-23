import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Fund } from "./Fund";
import { FundTransactionType } from "@/shared/constants/enum";

@Entity("fund_adjustments")
export class FundAdjustment extends BaseEntity {
  @Column({ type: "varchar" })
  code: string;

  @Column({ type: "timestamptz" })
  occurredAt: Date; // ngày ghi nhận điều chỉnh

  @Column({ type: "uuid" })
  fundId: string;

  @Column(BaseNumericColumnOptions)
  expectedAmount: number; // số tiền hệ thống ghi nhận

  @Column(BaseNumericColumnOptions)
  countedAmount: number; // số tiền thực tế kiểm kê

  @Column(BaseNumericColumnOptions)
  deltaAmount: number;

  @Column({
    type: "enum",
    enum: FundTransactionType,
    default: FundTransactionType.INCREASE,
  })
  direction: FundTransactionType;

  @Column({ type: "text" })
  reason: string;

  @Column({ type: "boolean", default: false })
  isInitial: boolean; // là phiếu điều chỉnh quỹ đầu kỳ

  // * ======================== RELATIONS ========================= //
  @ManyToOne(() => Fund, (fund) => fund.fundAdjustments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "fundId" })
  fund: Fund;
}
