import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity, In, JoinColumn, ManyToOne } from "typeorm";
import { Fund } from "../Fund";
import { Employee } from "./Employee";
import { IncomeExpenseTypeEnum } from "@/shared/constants/enum";
import { BaseEntityWithStore } from "./BaseEntityWithStore";
import { PartnerSnapshot } from "@/modules/partner";
import { Partner } from "../Partner";
import { EmployeeSnapshot } from "@/modules/employee/employee.types";
import { FundCategory } from "../FundCategory";
import { Order } from "./Order";

@Entity("income_expenses")
export class IncomeExpense extends BaseEntityWithStore {
  @Column({ type: "timestamptz" })
  occurredAt!: Date;

  //? số phiếu
  @Column({ type: "varchar", length: 20 })
  code!: string;

  @Column({ type: "enum", enum: IncomeExpenseTypeEnum })
  type!: IncomeExpenseTypeEnum;

  //? người lập phiếu
  @Column({ type: "uuid", nullable: true })
  creatorId!: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  creatorSnapshot!: EmployeeSnapshot | null;

  //? quỹ
  @Column({ type: "uuid" })
  fundId: string;

  @Column({ type: "uuid", nullable: true })
  orderId!: string | null;

  //? số tiền thu/chi
  @Column(BaseNumericColumnOptions)
  amount!: number;

  @Column({ type: "uuid", nullable: true, default: null })
  categoryId!: string;

  @Column({ type: "uuid", nullable: true, default: null })
  partnerId!: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  partnerSnapshot!: PartnerSnapshot | null;

  //? nội dung thu/chi
  @Column({ type: "text", nullable: true })
  description!: string | null;

  /* ================= relations ================= */
  @ManyToOne(() => Employee, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "creatorId" })
  creator: Employee | null;

  @ManyToOne(() => Fund, { onDelete: "CASCADE" })
  @JoinColumn({ name: "fundId" })
  fund: Fund;

  @ManyToOne(() => FundCategory, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "categoryId" })
  category: FundCategory | null;

  @ManyToOne(() => Partner, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "partnerId" })
  partner: Partner | null;

  @ManyToOne(() => Order, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "orderId" })
  order: Order | null;
}
