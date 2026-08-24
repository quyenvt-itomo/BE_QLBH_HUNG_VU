import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntityWithStore } from "./BaseEntityWithStore";
import { StockDocument, StockDocumentSnapshot } from "./StockDocument";
import { Partner, PartnerSnapshot } from "./Partner";
import { Warehouse, WarehouseSnapshot } from "./Warehouse";
import { ShippingPlan, ShippingPlanSnapshot } from "./ShippingPlan";

export enum GateLogTypeEnum {
  PURCHASE_RECEIPT = "purchase_receipt", // Nhập kho mua hàng
  ORDER_ISSUE = "order_issue", // Xuất kho bán hàng
}

export enum GateLogStatusEnum {
  PENDING = "pending", // Chưa xe vào

  ENTERED = "entered", // Đã xe vào

  EXITED = "exited", // Xe đã ra khỏi cổng

  LINKED = "linked", // Đã nối chuyến
}

export interface GateLogSnapshot {
  id: string;
  code: string;
  timeAt: Date;
  type: GateLogTypeEnum;
  vehiclePlate: string | null;
}

@Entity("gate_logs")
export class GateLog extends BaseEntityWithStore {
  // =====================================================
  // THÔNG TIN CƠ BẢN
  // =====================================================

  // = stockDocument.effectiveDate
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  timeAt: Date;

  @Column({ type: "varchar", length: 50 })
  code: string;

  @Column({ type: "varchar", length: 30 })
  type: GateLogTypeEnum;

  @Column({ type: "varchar", length: 30, default: GateLogStatusEnum.PENDING })
  status: GateLogStatusEnum;

  // =====================================================
  // PHIẾU NGUỒN
  // =====================================================

  @Column({ type: "uuid", nullable: true, default: null })
  stockDocumentId: string;
  @Column({ type: "jsonb", nullable: true, default: null })
  stockDocumentSnapshot: StockDocumentSnapshot | null;

  // =====================================================
  // THÔNG TIN GIAO DỊCH
  // =====================================================

  @Column({ type: "uuid", nullable: true, default: null })
  partnerId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  partnerSnapshot: PartnerSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  warehouseId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  warehouseSnapshot: WarehouseSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  shippingPlanId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  shippingPlanSnapshot: ShippingPlanSnapshot | null;

  // =====================================================
  // THÔNG TIN XE
  // =====================================================

  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  vehicleType: string | null;

  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  vehiclePlate: string | null;

  // =====================================================
  // XE VÀO CỔNG
  // =====================================================

  @Column({ type: "timestamptz", nullable: true, default: null })
  entryTime: Date | null;

  @Column({ type: "text", nullable: true, default: null })
  entryNote: string | null;

  // =====================================================
  // XE RA CỔNG
  // =====================================================

  @Column({ type: "timestamptz", nullable: true, default: null })
  exitTime: Date | null;

  @Column({ type: "text", nullable: true, default: null })
  exitNote: string | null;

  // =====================================================
  // NỐI CHUYẾN
  // =====================================================

  /**
   * Dùng để group pagination
   *
   * Không nối chuyến:
   * tripId = chính nó
   *
   * Nối chuyến:
   * Phiếu nhập A:
   * tripId = A.id
   *
   * Phiếu xuất B:
   * tripId = A.id
   */
  @Column({ type: "uuid", nullable: true, default: null })
  tripId: string | null;

  /**
   * Chỉ tồn tại ở phiếu xuất
   *
   * Phiếu xuất B
   * linkedGateLogId = A.id
   */
  @Column({ type: "uuid", nullable: true, default: null })
  linkedGateLogId: string | null;

  /**
   * Có phiếu nào nối tới mình không
   *
   * Dùng để khóa nút xe ra
   */
  @Column({ type: "boolean", default: false })
  isLinkedSource: boolean;

  // =====================================================
  // RELATIONS
  // =====================================================

  @ManyToOne(() => StockDocument, (sd) => sd.gateLogs, { onDelete: "SET NULL" })
  @JoinColumn({ name: "stockDocumentId" })
  stockDocument: StockDocument | null;

  @ManyToOne(() => Partner, { onDelete: "SET NULL" })
  @JoinColumn({ name: "partnerId" })
  partner: Partner | null;

  @ManyToOne(() => Warehouse, { onDelete: "SET NULL" })
  @JoinColumn({ name: "warehouseId" })
  warehouse: Warehouse | null;

  @ManyToOne(() => ShippingPlan, { onDelete: "SET NULL" })
  @JoinColumn({ name: "shippingPlanId" })
  shippingPlan: ShippingPlan | null;

  /**
   * Phiếu xuất -> phiếu nhập
   */
  @ManyToOne(() => GateLog, { onDelete: "SET NULL" })
  @JoinColumn({ name: "linkedGateLogId" })
  linkedGateLog: GateLog | null;

  /**
   * Phiếu nhập -> danh sách phiếu xuất nối tới
   * (thực tế thường chỉ có 1)
   */
  @OneToMany(() => GateLog, (gl) => gl.linkedGateLog)
  linkedGateLogs: GateLog[];
}
