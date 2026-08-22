import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { IncomeExpense } from "./IncomeExpense";
import { Order, OrderSnapshot } from "./Order";
import {
  PaymentRequestLine,
  PaymentRequestLineSnapshot,
} from "./PaymentRequestLine";

// Phân bổ thanh toán cho đơn hàng (Công nợ hoa hồng)
@Entity("commission_allocations")
export class CommissionAllocation extends BaseEntity {
  @Column({ type: "uuid" })
  incomeExpenseId: string;

  @Column({ type: "uuid", nullable: true, default: null })
  orderId: string;
  @Column({ type: "jsonb", nullable: true, default: null })
  orderSnapshot: OrderSnapshot | null; // snapshot thông tin đơn hàng, để tránh trường hợp thông tin đơn hàng bị thay đổi sau khi phân bổ

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
  @ManyToOne(() => IncomeExpense, (ie) => ie.commissionAllocations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "incomeExpenseId" })
  incomeExpense: IncomeExpense;

  @ManyToOne(() => Order, (order) => order.commissionAllocations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "orderId" })
  order: Order;

  @ManyToOne(() => PaymentRequestLine, { onDelete: "SET NULL" })
  @JoinColumn({ name: "paymentRequestLineId" })
  paymentRequestLine: PaymentRequestLine | null;
}
