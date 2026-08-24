import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity, In, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Fund, FundSnapshot } from "./Fund";
import { BaseEntityWithStore } from "./BaseEntityWithStore";
import { Partner, PartnerSnapshot } from "./Partner";
import { Attribute, AttributeSnapshot } from "../Attribute";
import { Order, OrderSnapshot } from "./Order";
import { Purchase, PurchaseSnapshot } from "./Purchase";
import { InvoiceAllocation } from "./InvoiceAllocation";
import { CommissionAllocation } from "./CommissionAllocation";
import { Employee, EmployeeSnapshot } from "./Employee";

export enum IncomeExpenseTypeEnum {
  INCOME = "income", // Thu
  EXPENSE = "expense", // Chi
}

@Entity("income_expenses")
export class IncomeExpense extends BaseEntityWithStore {
  @Column({ type: "timestamptz" })
  occurredAt: Date;

  //? số phiếu
  @Column({ type: "varchar", length: 20 })
  code: string;

  @Column({ type: "enum", enum: IncomeExpenseTypeEnum })
  type: IncomeExpenseTypeEnum;

  //? quỹ
  @Column({ type: "uuid", nullable: true, default: null })
  fundId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  fundSnapshot: FundSnapshot | null; // snapshot thông tin quỹ khi tạo phiếu thu/chi, để tránh trường hợp thông tin quỹ bị thay đổi sau khi tạo phiếu ảnh hưởng đến báo cáo doanh thu theo quỹ

  // Người phụ trách phiếu này
  @Column({ type: "uuid", nullable: true, default: null })
  staffId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  staffSnapshot: EmployeeSnapshot | null;

  //? số tiền thu/chi
  @Column(BaseNumericColumnOptions)
  amount: number;

  @Column({ type: "uuid", nullable: true, default: null })
  categoryId: string;
  @Column({ type: "jsonb", nullable: true, default: null })
  categorySnapshot: AttributeSnapshot | null;

  // Đối tác thu chi (Tính công nợ)
  @Column({ type: "uuid", nullable: true, default: null })
  partnerId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  partnerSnapshot: PartnerSnapshot | null;

  // Thu lãi khoản gửi
  // @Column({ type: "uuid", nullable: true, default: null })
  // depositInterestId: string | null;
  // @Column({ type: "jsonb", nullable: true, default: null })
  // depositInterestSnapshot: DepositInterestSnapshot | null;

  // Rút tiền khoản gửi
  // @Column({ type: "uuid", nullable: true, default: null })
  // depositId: string | null;
  // @Column({ type: "jsonb", nullable: true, default: null })
  // depositSnapshot: DepositSnapshot | null;

  // Thanh toán lãi khoản vay
  // @Column({ type: "uuid", nullable: true, default: null })
  // loanInterestId: string | null;
  // @Column({ type: "jsonb", nullable: true, default: null })
  // loanInterestSnapshot: LoanInterestSnapshot | null;

  // Thanh toán gốc khoản vay
  // @Column({ type: "uuid", nullable: true, default: null })
  // loanId: string | null;
  // @Column({ type: "jsonb", nullable: true, default: null })
  // loanSnapshot: LoanSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  shareholderId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  shareholderSnapshot: EmployeeSnapshot | null;

  //? nội dung thu/chi
  @Column({ type: "text", nullable: true })
  description: string | null;

  //? Đánh dấu đây là phiếu nộp thuế VAT (type = EXPENSE) → tăng số dư VAT
  @Column({ type: "boolean", default: false })
  isVatPayment: boolean;

  // * ======================== RELATIONS ========================= //
  @ManyToOne(() => Fund, { onDelete: "SET NULL" })
  @JoinColumn({ name: "fundId" })
  fund: Fund | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "categoryId" })
  category: Attribute | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "staffId" })
  staff: Employee | null;

  @ManyToOne(() => Partner, { onDelete: "SET NULL" })
  @JoinColumn({ name: "partnerId" })
  partner: Partner | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "shareholderId" })
  shareholder: Employee | null;

  @OneToMany(
    () => InvoiceAllocation,
    (allocation) => allocation.incomeExpense,
    { cascade: true },
  )
  invoiceAllocations: InvoiceAllocation[];

  @OneToMany(() => CommissionAllocation, (ca) => ca.incomeExpense, {
    cascade: true,
  })
  commissionAllocations: CommissionAllocation[];
}
