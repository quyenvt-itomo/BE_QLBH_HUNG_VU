import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { InventoryAdjustmentLine } from "./InventoryAdjustmentLine";
import { Employee } from "./Employee";
import { BaseEntityWithStore } from "./BaseEntityWithStore";
import { EmployeeSnapshot } from "@/modules/employee/employee.types";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";

@Entity("inventory_adjustments")
export class InventoryAdjustment extends BaseEntityWithStore {
  @Column({ type: "varchar" })
  code: string; // mã phiếu

  @Column({ type: "timestamptz" })
  occurredAt: Date; // ngày ghi nhận điều chỉnh

  @Column({ type: "uuid", nullable: true })
  adjustedById: string | null; // người điều chỉnh
  @Column({ type: "jsonb", nullable: true, default: null })
  adjustedBySnapshot: EmployeeSnapshot | null;

  @Column({ type: "text", nullable: true })
  reason: string | null; // lý do điều chỉnh

  @Column(BaseNumericColumnOptions)
  totalAdjustmentQty: number; // tổng số lượng điều chỉnh (có dấu: +tăng, -giảm)

  @Column(BaseNumericColumnOptions)
  totalAdjustmentValue: number; // tổng giá trị điều chỉnh (có dấu: +tăng, -giảm)

  @Column({ type: "boolean", default: false })
  isInitial: boolean; // là phiếu điều chỉnh tồn kho đầu kỳ

  // * ======================== RELATIONS ========================= //
  @OneToMany(() => InventoryAdjustmentLine, (line) => line.adjustment, {
    cascade: true,
  })
  lines: InventoryAdjustmentLine[];

  @ManyToOne(() => Employee, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "adjustedById" })
  adjustedBy: Employee | null;
}
