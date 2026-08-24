import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { OrderLine } from "./OrderLine";
import { Employee, EmployeeSnapshot } from "./Employee";
import { Partner, PartnerSnapshot } from "./Partner";
import { AdditionalInfo } from "@/shared/base/BaseValidator";
import { OrderCommission } from "./OrderCommission";
import { Quotation } from "./Quotation";
import { MeshSpec, MeshSpecSnapshot } from "./MeshSpec";
import { CommissionAllocation } from "./CommissionAllocation";
import { BaseEntityWithStore } from "./BaseEntityWithStore";
import { Invoice } from "./Invoice";
import { CommissionMode } from "@/shared/constants/enum";

export interface OrderSnapshot {
  id: string;
  code: string;
  timeAt: Date;
  customerId: string | null;
  customerSnapshot: PartnerSnapshot | null;
  staffId: string | null;
  staffSnapshot: EmployeeSnapshot | null;
  commissionMode: CommissionMode | null;
}

@Entity("orders")
export class Order extends BaseEntityWithStore {
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  timeAt: Date;
  @Column({ type: "varchar", length: 50 })
  code: string;

  @Column({ type: "varchar", length: 20, nullable: true, default: null })
  commissionMode: CommissionMode | null;

  // Gắn với báo giá
  @Column({ type: "uuid", nullable: true, default: null })
  quotationId: string | null;

  // Khách hàng
  @Column({ type: "uuid", nullable: true, default: null })
  customerId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  customerSnapshot: PartnerSnapshot | null;

  // Người phụ trách
  @Column({ type: "uuid", nullable: true, default: null })
  staffId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  staffSnapshot: EmployeeSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  meshSpecId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  meshSpecSnapshot: MeshSpecSnapshot | null;

  @Column({ type: "jsonb", default: () => "'[]'" })
  additionalInfo: AdditionalInfo[];

  // Đã hoàn thành chưa
  @Column({ type: "boolean", default: false })
  isCompleted: boolean;
  // Hoàn thành khi nào
  @Column({ type: "timestamptz", nullable: true, default: null })
  completedAt: Date | null;

  // Số lần tạo lệnh sản xuất
  @Column({ type: "int", default: 0 })
  productionCount: number;

  // =====================================================
  // SỐ LIỆU TỔNG HỢP (Aggregate — tránh tính lại khi hiển thị danh sách)
  // =====================================================
  @Column(BaseNumericColumnOptions)
  subTotal: number;

  @Column(BaseNumericColumnOptions)
  taxAmount: number;

  @Column(BaseNumericColumnOptions)
  totalAmount: number;

  @Column(BaseNumericColumnOptions)
  totalCommissionAmount: number;

  @Column(BaseNumericColumnOptions)
  totalCost: number;

  // ============================ RELATIONS ========================= //
  @ManyToOne(() => Quotation, { onDelete: "SET NULL" })
  @JoinColumn({ name: "quotationId" })
  quotation: Quotation | null;

  @ManyToOne(() => MeshSpec, { onDelete: "SET NULL" })
  @JoinColumn({ name: "meshSpecId" })
  meshSpec: MeshSpec | null;

  @ManyToOne(() => Partner, { onDelete: "SET NULL" })
  @JoinColumn({ name: "customerId" })
  customer: Partner | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "staffId" })
  staff: Employee | null;

  @OneToMany(() => OrderLine, (line) => line.order, {
    cascade: true,
  })
  lines: OrderLine[];

  @OneToMany(() => OrderCommission, (commission) => commission.order, {
    cascade: true,
  })
  commissions: OrderCommission[];

  @OneToMany(() => CommissionAllocation, (ca) => ca.order, {
    cascade: true,
  })
  commissionAllocations: CommissionAllocation[];

  @OneToMany(() => Invoice, (invoice) => invoice.order)
  invoices: Invoice[];
}
