import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntityWithCompany } from "./BaseEntityWithCompany";
import { EmployeeSnapshot } from "./Employee";
import { Employee } from "./Employee";
import { TransactionTypeEnum } from "@/shared/constants/enum";

@Entity("vat_debt_adjustments")
export class VatDebtAdjustment extends BaseEntityWithCompany {
  @Column({ type: "varchar", length: 25 })
  code!: string; // mã phiếu

  @Column({ type: "timestamptz" })
  occurredAt!: Date; // ngày ghi nhận điều chỉnh

  @Column({ type: "uuid", nullable: true })
  adjustedById!: string | null; // người điều chỉnh
  @Column({ type: "jsonb", nullable: true, default: null })
  adjustedBySnapshot!: EmployeeSnapshot | null;

  @Column(BaseNumericColumnOptions)
  expectedAmount!: number;

  @Column(BaseNumericColumnOptions)
  countedAmount!: number;

  @Column(BaseNumericColumnOptions)
  deltaAmount!: number;

  @Column({
    type: "enum",
    enum: TransactionTypeEnum,
    default: TransactionTypeEnum.IN,
  })
  type!: TransactionTypeEnum;

  @Column({ type: "text", nullable: true })
  reason!: string | null; // lý do điều chỉnh

  @Column({ type: "boolean", default: false })
  isInitialAdjustment!: boolean; // là phiếu điều chỉnh VAT đầu kỳ

  // * ======================== RELATIONS ========================= //
  @ManyToOne(() => Employee, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "adjustedById" })
  adjustedBy!: Employee | null;
}
