import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Address } from "@/shared/base/BaseValidator";
import { BaseEntityWithCompany } from "./BaseEntityWithCompany";
import { Employee } from "./Employee";
import { InventoryAdjustment } from "./InventoryAdjustment";

export interface WarehouseSnapshot {
  id: string;
  name: string;
  code: string;
}

@Entity("warehouses")
export class Warehouse extends BaseEntityWithCompany {
  @Column({ type: "varchar", length: 20 })
  code: string;
  @Column({ type: "varchar", length: 255 })
  name: string;
  @Column({ type: "varchar", length: 50, nullable: true })
  phone: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  address: Address | null; // địa chỉ
  @Column({ type: "uuid", nullable: true, default: null })
  managerId: string | null; // nhân viên phụ trách

  // * ========================= RELATIONS ========================= * //
  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "managerId" })
  manager: Employee | null;

  @OneToMany(() => InventoryAdjustment, (adjustment) => adjustment.warehouse, {
    cascade: true,
  })
  inventoryAdjustments: InventoryAdjustment[];
}
