import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { InventoryAdjustmentLine } from "./InventoryAdjustmentLine";
import { BaseEntityWithStore } from "./BaseEntityWithStore";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Warehouse } from "./Warehouse";

@Entity("inventory_adjustments")
export class InventoryAdjustment extends BaseEntityWithStore {
  @Column({ type: "varchar" })
  code: string; // mã phiếu

  @Column({ type: "uuid" })
  warehouseId: string; // kho điều chỉnh

  @Column({ type: "timestamptz" })
  occurredAt: Date; // ngày ghi nhận điều chỉnh

  @Column({ type: "text", nullable: true })
  reason: string | null; // lý do điều chỉnh

  @Column(BaseNumericColumnOptions)
  totalAdjustmentQuantity: number; // tổng số lượng điều chỉnh (có dấu: +tăng, -giảm)

  @Column(BaseNumericColumnOptions)
  totalAdjustmentValue: number; // tổng giá trị điều chỉnh (có dấu: +tăng, -giảm)

  @Column({ type: "boolean", default: false })
  isInitial: boolean; // là phiếu điều chỉnh tồn kho đầu kỳ

  // * ======================== RELATIONS ========================= //
  @ManyToOne(() => Warehouse, (warehouse) => warehouse.inventoryAdjustments, {
    onDelete: "SET NULL",
  })
  warehouse: Warehouse;

  @OneToMany(() => InventoryAdjustmentLine, (line) => line.adjustment, {
    cascade: true,
  })
  lines: InventoryAdjustmentLine[];
}
