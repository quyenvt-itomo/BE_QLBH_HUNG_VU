import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntityWithCompany } from "./BaseEntityWithCompany";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Partner, PartnerSnapshot } from "./Partner";
import { ApproveStatus } from "@/shared/constants/enum";
import { Purchase } from "./Purchase";
import { Order } from "./Order";
import { StockDocument } from "./StockDocument";
import { Employee, EmployeeSnapshot } from "./Employee";
import { Invoice } from "./Invoice";

export interface ShippingPlanSnapshot {
  id: string;
  code: string;
  partnerId: string | null;
  partnerSnapshot: PartnerSnapshot | null;
  unitPrice: number;
}

@Entity("shipping_plans")
export class ShippingPlan extends BaseEntityWithCompany {
  @Column({ type: "varchar", length: 50 })
  code: string;

  @Column({ type: "uuid", nullable: true, default: null })
  orderId: string | null; // Đơn hàng liên quan (nếu có)

  @Column({ type: "uuid", nullable: true, default: null })
  purchaseId: string | null; // Đơn mua liên quan (nếu có)

  @Column({ type: "uuid", nullable: true, default: null })
  partnerId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  partnerSnapshot: PartnerSnapshot | null;

  // Đơn giá
  @Column(BaseNumericColumnOptions)
  unitPrice: number;

  // Số chuyến
  @Column(BaseNumericColumnOptions)
  quantity: number;

  // Tổng tiền (unitPrice * quantity)
  @Column(BaseNumericColumnOptions)
  subTotal: number;

  // VAT
  @Column(BaseNumericColumnOptions)
  taxRate: number; // Phần trăm thuế VAT
  @Column(BaseNumericColumnOptions)
  taxAmount: number; // Số tiền thuế (subTotal * taxRate)

  @Column(BaseNumericColumnOptions)
  totalAmount: number; // Tổng tiền sau thuế (subTotal + taxAmount)

  @Column({ type: "timestamptz", nullable: true, default: null })
  approvedAt: Date | null; // Có thể là từ chối hoặc duyệt nhưng đều ghi lại thời điểm xử lý cuối cùng
  @Column({ type: "varchar", length: 50, default: ApproveStatus.PENDING })
  approveStatus: ApproveStatus;
  @Column({ type: "uuid", nullable: true, default: null })
  approverId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  approverSnapshot: EmployeeSnapshot | null;
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  rejectReason: string | null; // Nếu bị từ chối thì lưu lý do

  // ============================ RELATIONS ========================= //
  @ManyToOne(() => Partner, { onDelete: "SET NULL" })
  @JoinColumn({ name: "partnerId" })
  partner: Partner | null;

  @ManyToOne(() => Order, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId" })
  order: Order | null;

  @ManyToOne(() => Purchase, { onDelete: "CASCADE" })
  @JoinColumn({ name: "purchaseId" })
  purchase: Purchase | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "approverId" })
  approver: Employee | null;

  @OneToMany(() => StockDocument, (sd) => sd.shippingPlan)
  stockDocuments: StockDocument[];

  @OneToMany(() => Invoice, (invoice) => invoice.shippingPlan)
  invoices: Invoice[];
}
