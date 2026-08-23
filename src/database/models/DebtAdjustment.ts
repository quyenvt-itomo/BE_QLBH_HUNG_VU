import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Partner, PartnerSnapshot } from "./Partner";
import { DebtSide } from "@/shared/constants/enum";

@Entity("debt_adjustments")
export class DebtAdjustment extends BaseEntity {
  @Column({ type: "varchar", length: 25 })
  code: string; // mã phiếu

  @Column({ type: "timestamptz" })
  occurredAt: Date; // ngày ghi nhận điều chỉnh

  @Column({ type: "enum", enum: DebtSide })
  side: DebtSide;

  @Column({ type: "uuid", nullable: true, default: null })
  partnerId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  partnerSnapshot: PartnerSnapshot | null;
  @ManyToOne(() => Partner, { onDelete: "SET NULL" })
  @JoinColumn({ name: "partnerId" })
  partner: Partner | null;

  @Column(BaseNumericColumnOptions)
  expectedAmount: number;

  @Column(BaseNumericColumnOptions)
  countedAmount: number;

  @Column(BaseNumericColumnOptions)
  deltaAmount: number;

  @Column({ type: "text", nullable: true })
  reason: string | null; // lý do điều chỉnh

  @Column({ type: "boolean", default: false })
  isInitial: boolean; // là phiếu điều chỉnh nợ đầu kỳ
}
