import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Attribute } from "../Attribute";
import { Product } from "./Product";
import { BOMOperation } from "./BOMOperation";
import { BaseEntity } from "@/shared/base/BaseEntity";

@Entity("bill_of_materials")
export class BillOfMaterial extends BaseEntity {
  @Column({ type: "uuid" })
  productId: string;

  @Column({ type: "uuid" })
  unitId: string;

  // * ========================= RELATIONS ========================= * //
  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product: Product;

  @ManyToOne(() => Attribute, { onDelete: "CASCADE" })
  @JoinColumn({ name: "unitId" })
  unit: Attribute;

  @OneToMany(() => BOMOperation, (bomOp) => bomOp.billOfMaterial, {
    cascade: true,
  })
  operations: BOMOperation[];
}
