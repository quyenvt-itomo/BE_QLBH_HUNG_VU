import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Fund, FundSnapshot } from "./Fund";

@Entity("fund_adjustments")
export class FundAdjustment extends BaseEntity {
  @Column({ type: "varchar" })
  code: string;

  @Column({ type: "timestamptz" })
  occurredAt: Date; // ngày ghi nhận điều chỉnh

  @Column({ type: "uuid", nullable: true, default: null })
  fundId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  fundSnapshot: FundSnapshot | null;
  @ManyToOne(() => Fund, (f) => f.fundAdjustments, { onDelete: "SET NULL" })
  @JoinColumn({ name: "fundId" })
  fund: Fund;

  @Column(BaseNumericColumnOptions)
  expectedAmount: number; // số tiền hệ thống ghi nhận

  @Column(BaseNumericColumnOptions)
  countedAmount: number; // số tiền thực tế kiểm kê

  @Column(BaseNumericColumnOptions)
  deltaAmount: number; // = countedAmount - expectedAmount

  @Column({ type: "text", nullable: true, default: null })
  reason: string | null;

  @Column({ type: "boolean", default: false })
  isInitial: boolean; // là phiếu điều chỉnh quỹ đầu kỳ
}
