import { Column, Entity, OneToMany } from "typeorm";
import { InventoryAdjustmentLine } from "./InventoryAdjustmentLine";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { StoreEntity } from "./StoreEntity";

@Entity("inventory_adjustments")
export class InventoryAdjustment extends StoreEntity {
  @Column({ type: "varchar" })
  code: string; // mã phiếu

  @Column({ type: "timestamptz" })
  occurredAt: Date; // ngày ghi nhận điều chỉnh

  @Column({ type: "text", nullable: true })
  reason: string | null; // lý do điều chỉnh

  @Column(BaseNumericColumnOptions)
  totalAdjustmentQuantity: number; // tổng số lượng điều chỉnh (có dấu: +tăng, -giảm)

  @Column(BaseNumericColumnOptions)
  totalAdjustmentAmount: number; // tổng giá trị điều chỉnh (có dấu: +tăng, -giảm)

  @Column({ type: "boolean", default: false })
  isInitial: boolean; // là phiếu điều chỉnh tồn kho đầu kỳ

  // * ======================== RELATIONS ========================= //
  @OneToMany(() => InventoryAdjustmentLine, (line) => line.adjustment, {
    cascade: true,
  })
  lines: InventoryAdjustmentLine[];
}
