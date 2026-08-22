import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { WarehouseTransferLine } from "./WarehouseTransferLine";
import { Warehouse, WarehouseSnapshot } from "./Warehouse";
import { BaseEntityWithCompany } from "./BaseEntityWithCompany";
import { UserSnapshot } from "@/shared/base/BaseEntity";

@Entity("warehouse_transfers")
export class WarehouseTransfer extends BaseEntityWithCompany {
  @Column({ type: "timestamptz" })
  timeAt: Date; // Ngày tạo phiếu

  @Column({ type: "varchar", length: 50 })
  code: string;

  @Column({ type: "uuid", nullable: true, default: null })
  fromWarehouseId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  fromWarehouseSnapshot: WarehouseSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  toWarehouseId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  toWarehouseSnapshot: WarehouseSnapshot | null;

  @Column({ type: "text", nullable: true })
  reason: string | null;

  // Thông tin tiến trình
  @Column({ type: "timestamptz", nullable: true, default: null })
  exportedAt: Date | null;
  @Column({ type: "uuid", nullable: true, default: null })
  exporterId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  exporterSnapshot: UserSnapshot | null;

  @Column({ type: "timestamptz", nullable: true, default: null })
  importedAt: Date | null;
  @Column({ type: "uuid", nullable: true, default: null })
  importerId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  importerSnapshot: UserSnapshot | null;

  // * ========================= RELATIONS ========================= * //
  @ManyToOne(() => Warehouse, { onDelete: "SET NULL" })
  @JoinColumn({ name: "fromWarehouseId" })
  fromWarehouse: Warehouse | null;

  @ManyToOne(() => Warehouse, { onDelete: "SET NULL" })
  @JoinColumn({ name: "toWarehouseId" })
  toWarehouse: Warehouse | null;

  @OneToMany(() => WarehouseTransferLine, (line) => line.transfer, {
    cascade: true,
  })
  lines: WarehouseTransferLine[];
}
