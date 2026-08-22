import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Partner } from "../Partner";
import {
  DebtDirectionEnum,
  PartnerDebtSideEnum,
} from "@/shared/constants/enum";
import { EmployeeSnapshot } from "@/modules/employee/employee.types";
import { Employee } from "./Employee";
import { BaseEntityWithStore } from "./BaseEntityWithStore";

@Entity("partner_debt_adjustments")
export class PartnerDebtAdjustment extends BaseEntityWithStore {
  @Column({ type: "varchar", length: 25 })
  code!: string; // mã phiếu

  @Column({ type: "timestamptz" })
  occurredAt!: Date; // ngày ghi nhận điều chỉnh

  @Column({ type: "uuid", nullable: true })
  adjustedById!: string | null; // người điều chỉnh
  @Column({ type: "jsonb", nullable: true, default: null })
  adjustedBySnapshot!: EmployeeSnapshot | null;

  @Column({ type: "enum", enum: PartnerDebtSideEnum })
  side: PartnerDebtSideEnum;

  @Column({ type: "uuid" })
  partnerId!: string;

  @Column(BaseNumericColumnOptions)
  expectedAmount!: number;

  @Column(BaseNumericColumnOptions)
  countedAmount!: number;

  @Column(BaseNumericColumnOptions)
  deltaAmount!: number;

  @Column({
    type: "enum",
    enum: DebtDirectionEnum,
    default: DebtDirectionEnum.INCREASE,
  })
  direction!: DebtDirectionEnum;

  @Column({ type: "text", nullable: true })
  reason!: string | null; // lý do điều chỉnh

  @Column({ type: "boolean", default: false })
  isInitialAdjustment!: boolean; // là phiếu điều chỉnh nợ đầu kỳ

  // * ======================== RELATIONS ========================= //
  @ManyToOne(() => Partner, { onDelete: "CASCADE" })
  @JoinColumn({ name: "partnerId" })
  partner: Partner;

  @ManyToOne(() => Employee, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "adjustedById" })
  adjustedBy!: Employee | null;
}
