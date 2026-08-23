import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Fund, FundSnapshot } from "../Fund";
import { StoreEntity } from "./StoreEntity";
import { PartnerSnapshot } from "../Partner";
import { Partner } from "../Partner";
import { Attribute, AttributeSnapshot } from "../Attribute";
import { Order } from "./Order";

export enum IncomeExpenseType {
  INCOME = "INCOME", // Thu
  EXPENSE = "EXPENSE", // Chi
}

@Entity("income_expenses")
export class IncomeExpense extends StoreEntity {
  @Column({ type: "timestamptz" })
  occurredAt: Date;

  @Column({ type: "varchar", length: 20 })
  code: string;

  @Column({ type: "enum", enum: IncomeExpenseType })
  type: IncomeExpenseType;

  @Column({ type: "uuid", nullable: true, default: null })
  fundId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  fundSnapshot: FundSnapshot | null;
  @ManyToOne(() => Fund, { onDelete: "CASCADE" })
  @JoinColumn({ name: "fundId" })
  fund: Fund;

  @Column({ type: "uuid", nullable: true })
  orderId: string | null;
  @ManyToOne(() => Order, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId" })
  order: Order | null;

  @Column({ type: "uuid", nullable: true, default: null })
  categoryId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  categorySnapshot: AttributeSnapshot | null;
  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "categoryId" })
  category: Attribute | null;

  @Column({ type: "uuid", nullable: true, default: null })
  partnerId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  partnerSnapshot: PartnerSnapshot | null;

  //? nội dung thu/chi
  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column(BaseNumericColumnOptions)
  amount: number;

  @ManyToOne(() => Partner, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "partnerId" })
  partner: Partner | null;
}
