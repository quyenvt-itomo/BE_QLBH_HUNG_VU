import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseEntityWithCompany } from "./BaseEntityWithCompany";
import { Partner, PartnerSnapshot } from "./Partner";
import { Order, OrderSnapshot } from "./Order";
import { Purchase, PurchaseSnapshot } from "./Purchase";
import { ShippingPlan, ShippingPlanSnapshot } from "./ShippingPlan";
import { InvoiceAllocation } from "./InvoiceAllocation";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { StockDocument, StockDocumentSnapshot } from "./StockDocument";

export enum InvoiceType {
  INPUT = "input", // Hóa đơn đầu vào
  OUTPUT = "output", // Hóa đơn đầu ra
}

export enum InvoiceSourceType {
  ORDER = "order", // Theo toàn bộ đơn hàng/đơn mua
  SALES_SERVICE = "sales_service", // Theo dịch vụ
  SHIPPING_PLAN = "shipping_plan", // Theo kế hoạch giao hàng
  DOCUMENT = "document", // Theo phiếu xuất/nhập kho
  OTHER = "other", // Khác, không theo các nguồn trên / Tự nhập line
}

export enum InvoiceStatus {
  EFFECTIVE = "effective", // Có hiệu lực
  PARTIALLY_PAID = "partially_paid", // Đã thanh toán một phần
  PAID = "paid", // Đã thanh toán hết
  CANCELED = "canceled", // Đã hủy
}

export interface InvoiceLine {
  sourceLineId?: string | null; // orderLineId, purchaseLineId, stockDocumentLineId

  productId?: string | null; // productId hoặc serviceId sẽ có một trong hai, không có cả hai
  productName?: string | null;
  productCode?: string | null;
  unit?: string | null;

  quantity: number;
  unitPrice: number;
  subTotal: number;
  taxRate?: number;
  taxAmount: number;
  totalAmount: number;

  note?: string | null;
}

export interface InvoiceSnapshot {
  id: string;
  invoiceDate: Date;
  invoiceNumber: string;
  type: InvoiceType;
  sourceType: InvoiceSourceType;
  referenceNumber: string | null;
  referenceDate: Date | null;
  partnerId: string | null;
  partnerSnapshot: PartnerSnapshot | null;
  orderId: string | null;
  orderSnapshot: OrderSnapshot | null;
  purchaseId: string | null;
  purchaseSnapshot: PurchaseSnapshot | null;
  stockDocumentId: string | null;
  stockDocumentSnapshot: StockDocumentSnapshot | null;
  shippingPlanId: string | null;
  shippingPlanSnapshot: ShippingPlanSnapshot | null;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
}

@Entity("invoices")
export class Invoice extends BaseEntityWithCompany {
  @Column({ type: "timestamptz" })
  invoiceDate: Date;
  @Column({ type: "varchar", length: 20 })
  invoiceNumber: string;

  @Column({ type: "varchar", length: 20, default: InvoiceStatus.EFFECTIVE })
  status: InvoiceStatus;

  @Column({ type: "enum", enum: InvoiceType })
  type: InvoiceType;
  @Column({ type: "varchar", length: 20, default: InvoiceSourceType.OTHER })
  sourceType: InvoiceSourceType;

  // Số chứng từ, ngày chứng từ nếu là hóa đơn khác
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  referenceNumber: string | null;
  @Column({ type: "timestamptz", nullable: true, default: null })
  referenceDate: Date | null;

  // Đối tác thu chi (Tính công nợ)
  @Column({ type: "uuid", nullable: true, default: null })
  partnerId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  partnerSnapshot: PartnerSnapshot | null;

  // Đơn hàng liên quan
  @Column({ type: "uuid", nullable: true, default: null })
  orderId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  orderSnapshot: OrderSnapshot | null;

  // Đơn mua liên quan
  @Column({ type: "uuid", nullable: true, default: null })
  purchaseId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  purchaseSnapshot: PurchaseSnapshot | null;

  // Phiếu kho liên quan
  @Column({ type: "uuid", nullable: true, default: null })
  stockDocumentId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  stockDocumentSnapshot: StockDocumentSnapshot | null;

  // Phương án vận chuyển liên quan
  @Column({ type: "uuid", nullable: true, default: null })
  shippingPlanId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  shippingPlanSnapshot: ShippingPlanSnapshot | null;

  @Column(BaseNumericColumnOptions)
  subTotal: number; // Tổng tiền trước thuế
  @Column(BaseNumericColumnOptions)
  taxAmount: number; // Tổng tiền thuế
  @Column(BaseNumericColumnOptions)
  totalAmount: number; // Tổng tiền sau thuế

  // Đã thanh toán
  @Column(BaseNumericColumnOptions)
  totalPaidAmount: number;

  // Còn nợ
  @Column(BaseNumericColumnOptions)
  totalRemainingAmount: number; // = totalAmount - totalPaidAmount

  @Column({ type: "jsonb", default: () => "'[]'" })
  lines: InvoiceLine[];

  /* ================= relations ================= */
  @ManyToOne(() => Partner, { onDelete: "SET NULL" })
  @JoinColumn({ name: "partnerId" })
  partner: Partner | null;

  @ManyToOne(() => Order, (order) => order.invoices, { onDelete: "SET NULL" })
  @JoinColumn({ name: "orderId" })
  order: Order | null;

  @ManyToOne(() => Purchase, (purchase) => purchase.invoices, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "purchaseId" })
  purchase: Purchase | null;

  @ManyToOne(() => StockDocument, (sd) => sd.invoices, { onDelete: "SET NULL" })
  @JoinColumn({ name: "stockDocumentId" })
  stockDocument: StockDocument | null;

  @ManyToOne(() => ShippingPlan, (sp) => sp.invoices, { onDelete: "SET NULL" })
  @JoinColumn({ name: "shippingPlanId" })
  shippingPlan: ShippingPlan | null;

  @OneToMany(() => InvoiceAllocation, (allocation) => allocation.invoice)
  allocations: InvoiceAllocation[];
}
