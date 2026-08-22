import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { PaymentRequest } from "./PaymentRequest";
import { Invoice, InvoiceSnapshot } from "./Invoice";
import { Order, OrderSnapshot } from "./Order";
import { InvoiceAllocation } from "./InvoiceAllocation";

export interface PaymentRequestLineSnapshot {
  id: string;
  paymentRequestId: string;
  code: string;
  invoiceId: string | null;
  invoiceSnapshot: InvoiceSnapshot | null;
  orderId: string | null;
  orderSnapshot: OrderSnapshot | null;
}

@Entity("payment_request_lines")
export class PaymentRequestLine extends BaseEntity {
  @Column({ type: "uuid" })
  paymentRequestId: string;
  @Column({ type: "varchar", length: 50 })
  code: string;

  // Chỉ dùng cho đề nghị thanh toán công nợ nhà cung cấp
  // Thanh toán hoa hồng chỉ gắn với đơn hàng
  @Column({ type: "uuid", nullable: true, default: null })
  invoiceId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  invoiceSnapshot: InvoiceSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  orderId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  orderSnapshot: OrderSnapshot | null;

  @Column(BaseNumericColumnOptions)
  amount: number; // Số tiền sau thuế (subTotal + taxAmount)

  // Đã thanh toán
  @Column({ type: "boolean", default: false })
  isPaid: boolean;

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => PaymentRequest, (paymentRequest) => paymentRequest.lines, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "paymentRequestId" })
  paymentRequest: PaymentRequest;

  @ManyToOne(() => Invoice, { onDelete: "SET NULL" })
  @JoinColumn({ name: "invoiceId" })
  invoice: Invoice | null;

  @ManyToOne(() => Order, { onDelete: "SET NULL" })
  @JoinColumn({ name: "orderId" })
  order: Order | null;

  @OneToMany(
    () => InvoiceAllocation,
    (allocation) => allocation.paymentRequestLine,
  )
  invoiceAllocations: InvoiceAllocation[];
}
