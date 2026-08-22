import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import {
  BaseEntity,
  BaseQuantityNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { PurchaseRequisition } from "./PurchaseRequisition";
import { Product, ProductSnapshot } from "./Product";
import { Attribute, AttributeSnapshot } from "../Attribute";

@Entity("purchase_requisition_lines")
export class PurchaseRequisitionLine extends BaseEntity {
  @Column({ type: "uuid" })
  purchaseRequisitionId: string;

  @Column({ type: "uuid", nullable: true, default: null })
  productId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  productSnapshot: ProductSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  unitId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  unitSnapshot: AttributeSnapshot | null;

  @Column(BaseQuantityNumericColumnOptions)
  quantity: number;

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(
    () => PurchaseRequisition,
    (purchaseRequisition) => purchaseRequisition.lines,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "purchaseRequisitionId" })
  purchaseRequisition: PurchaseRequisition;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product: Product | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "unitId" })
  unit: Attribute | null;
}
