import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntityWithStore } from "./BaseEntityWithStore";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { InventoryConversionLine } from "./InventoryConversionLine";
import { Employee, EmployeeSnapshot } from "./Employee";
import { Warehouse, WarehouseSnapshot } from "./Warehouse";
import { Product, ProductSnapshot } from "./Product";

// =====================================================
// ENUMS
// =====================================================
export enum InventoryConversionStatusEnum {
  PENDING = "pending", // Mới tạo, chưa thực hiện chuyển mã
  COMPLETED = "completed", // Đã hoàn thành chuyển mã
}

// =====================================================
// SNAPSHOT
// =====================================================
export interface InventoryConversionSnapshot {
  id: string;
  code: string;
  timeAt: Date | null;
  status: InventoryConversionStatusEnum;
  staffId: string | null;
  staffSnapshot: EmployeeSnapshot | null;
  warehouseId: string | null;
  warehouseSnapshot: WarehouseSnapshot | null;
}

// =====================================================
// ENTITY: Phiếu chuyển mã hàng trong kho
// Nghiệp vụ: Convert hàng hóa A → hàng hóa B (cùng kho)
// Giá trị kho giữ nguyên (quy đổi ngang giá)
// =====================================================
@Entity("inventory_conversions")
export class InventoryConversion extends BaseEntityWithStore {
  // =====================================================
  // THÔNG TIN CƠ BẢN
  // =====================================================
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  timeAt: Date | null;

  @Column({ type: "varchar", length: 50 })
  code: string;

  @Column({
    type: "varchar",
    length: 30,
    default: InventoryConversionStatusEnum.PENDING,
  })
  status: InventoryConversionStatusEnum;

  @Column({ type: "text", nullable: true, default: null })
  reason: string | null;

  // =====================================================
  // NGƯỜI THỰC HIỆN
  // =====================================================
  @Column({ type: "uuid", nullable: true, default: null })
  staffId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  staffSnapshot: EmployeeSnapshot | null;

  // =====================================================
  // KHO THỰC HIỆN CHUYỂN MÃ
  // =====================================================
  @Column({ type: "uuid", nullable: true, default: null })
  warehouseId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  warehouseSnapshot: WarehouseSnapshot | null;

  // =====================================================
  // SẢN PHẨM NGUỒN (FROM)
  // =====================================================
  @Column({ type: "uuid", nullable: true, default: null })
  fromProductId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  fromProductSnapshot: ProductSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  fromUnitId: string | null;

  @Column({ ...BaseNumericColumnOptions, default: 0 })
  fromQuantity: number;

  // =====================================================
  // SẢN PHẨM ĐÍCH (TO)
  // =====================================================
  @Column({ type: "uuid", nullable: true, default: null })
  toProductId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  toProductSnapshot: ProductSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  toUnitId: string | null;

  @Column({ ...BaseNumericColumnOptions, default: 0 })
  toQuantity: number;

  // =====================================================
  // RELATIONS
  // =====================================================
  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "staffId" })
  staff: Employee | null;

  @ManyToOne(() => Warehouse, { onDelete: "SET NULL" })
  @JoinColumn({ name: "warehouseId" })
  warehouse: Warehouse | null;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "fromProductId" })
  fromProduct: Product | null;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "toProductId" })
  toProduct: Product | null;

  @OneToMany(
    () => InventoryConversionLine,
    (line) => line.inventoryConversion,
    { cascade: true },
  )
  lines: InventoryConversionLine[];
}
