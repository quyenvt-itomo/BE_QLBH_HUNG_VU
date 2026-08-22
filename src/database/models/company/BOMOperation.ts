import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Attribute } from "../Attribute";
import { BillOfMaterial } from "./BillOfMaterial";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { BOMOperationMaterial } from "./BOMOperationMaterial";

@Entity("bom_operations")
export class BOMOperation extends BaseEntity {
  @Column({ type: "uuid" })
  billOfMaterialId: string;

  @Column({ type: "uuid" })
  operationId: string;

  // Giá sản xuất của công đoạn này
  @Column(BaseNumericColumnOptions)
  unitProductionCost: number;

  // * ========================= RELATIONS ========================= * //
  @ManyToOne(() => BillOfMaterial, (bom) => bom.operations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "billOfMaterialId" })
  billOfMaterial: BillOfMaterial;

  @ManyToOne(() => Attribute, { onDelete: "CASCADE" })
  @JoinColumn({ name: "operationId" })
  operation: Attribute;

  @OneToMany(() => BOMOperationMaterial, (bomOpMat) => bomOpMat.bomOperation, {
    cascade: true,
  })
  materials: BOMOperationMaterial[];
}
