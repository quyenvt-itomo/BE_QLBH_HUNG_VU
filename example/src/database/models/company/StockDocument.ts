import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntityWithCompany } from "./BaseEntityWithCompany";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { StockDocumentLine } from "./StockDocumentLine";
import { Partner, PartnerSnapshot } from "./Partner";
import { Warehouse, WarehouseSnapshot } from "./Warehouse";
import { ShippingPlan, ShippingPlanSnapshot } from "./ShippingPlan";
import { Representative } from "@/shared/base/BaseValidator";
import { GateLog } from "./GateLog";
import { Invoice } from "./Invoice";
import { Order, OrderSnapshot } from "./Order";
import { Purchase, PurchaseSnapshot } from "./Purchase";
import { Production, ProductionSnapshot } from "./Production";
import { Employee, EmployeeSnapshot } from "./Employee";

export enum StockDocumentType {
  PURCHASE_RECEIPT = "purchase_receipt", // Phiếu nhập kho từ đơn mua hàng
  MATERIAL_ISSUE = "material_issue", // Phiếu xuất kho bán hàng
  PRODUCTION_RECEIPT = "production_receipt", // Phiếu nhập kho từ sản xuất
  ORDER_ISSUE = "order_issue", // Phiếu xuất kho từ đơn bán hàng
}

export enum StockDocumentStatus {
  PENDING = "pending", // Mới tạo, chưa xuất kho đối với xuất bán, chưa nhập kho đối với nhập mua
  EXPORTED = "exported", // Đã xuất kho đối với xuất bán (Các phiếu khác không có trạng thái này)
  COMPLETED = "completed", // Đã nhập kho đối với nhập mua, đã nhập kho hoàn chỉnh đối với sản xuất, đã xuất kho hoàn chỉnh đối với xuất bán
}

export interface StockDocumentSnapshot {
  id: string;
  code: string;
  effectiveDate: Date | null;
  type: StockDocumentType;

  purchaseId: string | null;
  purchaseSnapshot: PurchaseSnapshot | null;

  orderId: string | null;
  orderSnapshot: OrderSnapshot | null;

  productionId: string | null;
  productionSnapshot: ProductionSnapshot | null;

  partnerId: string | null;
  partnerSnapshot: PartnerSnapshot | null;

  warehouseId: string | null;
  warehouseSnapshot: WarehouseSnapshot | null;

  shippingPlanId: string | null;
  shippingPlanSnapshot: ShippingPlanSnapshot | null;

  shipperId: string | null;
  shipperSnapshot: PartnerSnapshot | null;

  representative: Representative | null;
  vehicleType: string | null;
  vehiclePlate: string | null;
  totalVarianceAmount: number;
  actualExportDate: Date | null;
  actualImportDate: Date | null;
}

@Entity("stock_documents")
export class StockDocument extends BaseEntityWithCompany {
  // Ngày hiệu lực dự kiến (Ngày nhập đối với nhập mua, ngày xuất dự kiến đối với xuất bán)
  @Column({ type: "timestamptz", nullable: true, default: null })
  effectiveDate: Date | null;
  @Column({ type: "varchar", length: 50 })
  code: string;
  @Column({ type: "varchar", length: 20 })
  type: StockDocumentType;

  @Column({ type: "uuid", nullable: true, default: null })
  orderId: string | null; // Đơn hàng liên quan (nếu có)
  @Column({ type: "jsonb", nullable: true, default: null })
  orderSnapshot: OrderSnapshot | null; // Snapshot của đơn hàng liên quan (nếu có)

  @Column({ type: "uuid", nullable: true, default: null })
  purchaseId: string | null; // Đơn mua liên quan (nếu có)
  @Column({ type: "jsonb", nullable: true, default: null })
  purchaseSnapshot: PurchaseSnapshot | null; // Snapshot của đơn mua liên quan (nếu có)

  @Column({ type: "uuid", nullable: true, default: null })
  productionId: string | null; // Lệnh sản xuất liên quan (nếu có)
  @Column({ type: "jsonb", nullable: true, default: null })
  productionSnapshot: ProductionSnapshot | null; // Snapshot của lệnh sản xuất liên quan (nếu có)

  @Column({ type: "int", default: 1 })
  sequenceNumber: number; // Số thứ tự (Vì là theo đơn hàng, đơn mua, hoặc lệnh sản xuất)

  @Column({ type: "uuid", nullable: true, default: null })
  partnerId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  partnerSnapshot: PartnerSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  shipperId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  shipperSnapshot: PartnerSnapshot | null;

  // Người đại diện giao dịch (nếu là purchase_receipt, hoặc order_issue)
  @Column({ type: "jsonb", nullable: true, default: null })
  representative: Representative | null;

  // Loại phương tiện vận chuyển
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  vehicleType: string | null;

  // Biển số xe
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  vehiclePlate: string | null;

  @Column({ type: "uuid", nullable: true, default: null })
  warehouseId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  warehouseSnapshot: WarehouseSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  shippingPlanId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  shippingPlanSnapshot: ShippingPlanSnapshot | null;

  // Tổng tiền chênh lệch
  @Column(BaseNumericColumnOptions)
  totalVarianceAmount: number;

  // Ngày xuất kho thực tế (chỉ có đối với xuất bán, mặc định = timeAt nếu là xuất NVL)
  @Column({ type: "timestamptz", nullable: true, default: null })
  actualExportDate: Date | null;
  // Ngày nhập kho thực tế (chỉ có đối với nhập mua, mặc định = timeAt nếu là nhập thành phẩm)
  @Column({ type: "timestamptz", nullable: true, default: null })
  actualImportDate: Date | null;

  // Người xác nhận xuất nhập kho
  @Column({ type: "uuid", nullable: true, default: null })
  staffId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  staffSnapshot: EmployeeSnapshot | null;

  // Người xác nhận số lượng khác nhận (chỉ cho ORDER_ISSUE)
  @Column({ type: "uuid", nullable: true, default: null })
  confirmerId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  confirmerSnapshot: EmployeeSnapshot | null;

  @Column({ type: "varchar", length: 50, default: StockDocumentStatus.PENDING })
  status: StockDocumentStatus;

  // ============================ RELATIONS ========================= //
  @ManyToOne(() => Partner, { onDelete: "SET NULL" })
  @JoinColumn({ name: "partnerId" })
  partner: Partner | null;

  @ManyToOne(() => Partner, { onDelete: "SET NULL" })
  @JoinColumn({ name: "shipperId" })
  shipper: Partner | null;

  @ManyToOne(() => Warehouse, { onDelete: "SET NULL" })
  @JoinColumn({ name: "warehouseId" })
  warehouse: Warehouse | null;

  @ManyToOne(() => ShippingPlan, (sp) => sp.stockDocuments, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "shippingPlanId" })
  shippingPlan: ShippingPlan | null;

  @ManyToOne(() => Order, { onDelete: "SET NULL" })
  @JoinColumn({ name: "orderId" })
  order: Order | null;

  @ManyToOne(() => Purchase, { onDelete: "SET NULL" })
  @JoinColumn({ name: "purchaseId" })
  purchase: Purchase | null;

  @ManyToOne(() => Production, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productionId" })
  production: Production | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "staffId" })
  staff: Employee | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "confirmerId" })
  confirmer: Employee | null;

  @OneToMany(() => StockDocumentLine, (line) => line.stockDocument, {
    cascade: true,
  })
  lines: StockDocumentLine[];

  @OneToMany(() => GateLog, (gl) => gl.stockDocument, { cascade: ["insert"] })
  gateLogs: GateLog[];

  @OneToMany(() => Invoice, (invoice) => invoice.stockDocument)
  invoices: Invoice[];
}
