import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Partner } from "../Partner";
import { EmployeeSnapshot } from "@/modules/employee/employee.types";
import { Employee } from "./Employee";
import { BaseEntityWithStore } from "./BaseEntityWithStore";

@Entity("partner_debt_offsets")
export class PartnerDebtOffset extends BaseEntityWithStore {
  @Column({ type: "varchar", length: 25 })
  code!: string; // mã phiếu

  @Column({ type: "timestamptz" })
  occurredAt!: Date; // ngày ghi nhận đối soát

  @Column({ type: "uuid", nullable: true })
  offsetById!: string | null; // người điều chỉnh
  @Column({ type: "jsonb", nullable: true, default: null })
  offsetBySnapshot!: EmployeeSnapshot | null;

  @Column({ type: "uuid" })
  partnerId!: string;

  @Column(BaseNumericColumnOptions)
  payableDebtAmount!: number;

  @Column(BaseNumericColumnOptions)
  receivableDebtAmount!: number;

  @Column(BaseNumericColumnOptions)
  offsetAmount!: number;

  @Column({ type: "text", nullable: true })
  reason!: string | null; // lý do đối soát

  // * ======================== RELATIONS ========================= //
  @ManyToOne(() => Partner, { onDelete: "CASCADE" })
  @JoinColumn({ name: "partnerId" })
  partner: Partner;

  @ManyToOne(() => Employee, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "offsetById" })
  offsetBy!: Employee | null;
}
