import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { IncomeExpense } from "./IncomeExpense";
import { Invoice, InvoiceSnapshot } from "./Invoice";
import {
  PaymentRequestLine,
  PaymentRequestLineSnapshot,
} from "./PaymentRequestLine";
import { OrderSnapshot } from "./Order";

// Phân bổ thanh toán cho hóa đơn (Công nợ đối tác)
@Entity("invoice_allocations")
export class InvoiceAllocation extends BaseEntity {
  @Column({ type: "uuid" })
  incomeExpenseId: string;

  @Column({ type: "uuid", nullable: true, default: null })
  orderId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  orderSnapshot: OrderSnapshot | null; // snapshot thông tin đơn hàng, để tránh trường hợp thông tin đơn hàng bị thay đổi sau khi phân bổ

  @Column({ type: "uuid", nullable: true, default: null })
  purchaseId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  purchaseSnapshot: any | null; // snapshot thông tin đơn mua, để tránh trường hợp thông tin đơn mua bị thay đổi sau khi phân bổ

  @Column({ type: "uuid", nullable: true, default: null })
  invoiceId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  invoiceSnapshot: InvoiceSnapshot | null; // snapshot thông tin hóa đơn, để tránh trường hợp thông tin hóa đơn bị thay đổi sau khi phân bổ

  // Có thể là được gắn với một đề nghi thanh toán nhỏ
  @Column({ type: "uuid", nullable: true, default: null })
  paymentRequestLineId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  paymentRequestLineSnapshot: PaymentRequestLineSnapshot | null; // snapshot thông tin dòng đề nghị thanh toán, để tránh trường hợp thông tin dòng đề nghị thanh toán bị thay đổi sau khi phân bổ

  @Column(BaseNumericColumnOptions)
  amount: number;

  @Column({ type: "timestamptz" })
  allocatedAt: Date;

  // * ======================== RELATIONS ========================= //
  @ManyToOne(() => IncomeExpense, (ie) => ie.invoiceAllocations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "incomeExpenseId" })
  incomeExpense: IncomeExpense;

  @ManyToOne(() => Invoice, (invoice) => invoice.allocations, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "invoiceId" })
  invoice: Invoice | null;

  @ManyToOne(() => PaymentRequestLine, { onDelete: "SET NULL" })
  @JoinColumn({ name: "paymentRequestLineId" })
  paymentRequestLine: PaymentRequestLine | null;
}
