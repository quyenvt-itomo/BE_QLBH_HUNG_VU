import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity } from "typeorm";

@Entity("vat_adjustments")
export class VatAdjustment extends BaseEntity {
  @Column({ type: "varchar", length: 25 })
  code: string; // mã phiếu

  @Column({ type: "timestamptz" })
  occurredAt: Date; // ngày ghi nhận điều chỉnh

  @Column(BaseNumericColumnOptions)
  expectedAmount: number;

  @Column(BaseNumericColumnOptions)
  countedAmount: number;

  @Column(BaseNumericColumnOptions)
  deltaAmount: number; // = countedAmount - expectedAmount, có dấu: +tăng, -giảm

  @Column({ type: "text", nullable: true })
  reason: string | null; // lý do điều chỉnh

  @Column({ type: "boolean", default: false })
  isInitial: boolean; // là phiếu điều chỉnh VAT đầu kỳ
}
