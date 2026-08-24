import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntityWithStore } from "./BaseEntityWithStore";
import { MeshSpecLine } from "./MeshSpecLine";
import { Partner, PartnerSnapshot } from "./Partner";
import { Employee, EmployeeSnapshot } from "./Employee";
import { BaseQuantityNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Attribute } from "../Attribute";

export interface MeshSpecSnapshot {
  id: string;
  code: string;
  timeAt: Date;
  customerId: string | null;
  customerSnapshot: PartnerSnapshot | null;
  staffId: string | null;
  staffSnapshot: EmployeeSnapshot | null;
}

@Entity("mesh_specs")
export class MeshSpec extends BaseEntityWithStore {
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  timeAt: Date;
  @Column({ type: "varchar", length: 50 })
  code: string;

  @Column({ type: "uuid", nullable: true, default: null })
  customerId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  customerSnapshot: PartnerSnapshot | null;

  // Người người phụ trách
  @Column({ type: "uuid", nullable: true, default: null })
  staffId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  staffSnapshot: EmployeeSnapshot | null;

  // Tên cột khu vực
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  areaColumn: string | null;

  // Đơn vị tính số lượng
  @Column({ type: "uuid", nullable: true, default: null })
  quantityUnitId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  quantityUnitSnapshot: PartnerSnapshot | null;

  // Đơn vị tính khối lượng
  @Column({ type: "uuid", nullable: true, default: null })
  weightUnitId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  weightUnitSnapshot: PartnerSnapshot | null;

  // Đơn vị tính diện tích
  @Column({ type: "uuid", nullable: true, default: null })
  areaUnitId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  areaUnitSnapshot: PartnerSnapshot | null;

  // Tổng số lượng
  @Column(BaseQuantityNumericColumnOptions)
  totalQuantity: number;

  // Tổng khối lượng
  @Column(BaseQuantityNumericColumnOptions)
  totalWeight: number;

  // Tổng diện tích
  @Column(BaseQuantityNumericColumnOptions)
  totalArea: number;

  // ============================ RELATIONS ========================= //
  @ManyToOne(() => Partner, { onDelete: "SET NULL" })
  @JoinColumn({ name: "customerId" })
  customer: Partner | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "staffId" })
  staff: Employee | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "quantityUnitId" })
  quantityUnit: Attribute | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "weightUnitId" })
  weightUnit: Attribute | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "areaUnitId" })
  areaUnit: Attribute | null;

  @OneToMany(() => MeshSpecLine, (line) => line.meshSpec, {
    cascade: true,
  })
  lines: MeshSpecLine[];
}
