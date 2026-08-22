import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import {
  BaseEntity,
  BaseFactorNumericColumnOptions,
  BaseNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { Attribute } from "../Attribute";
import { Product } from "./Product";

@Entity("product_extra_units")
export class ProductExtraUnit extends BaseEntity {
  @Column({ type: "uuid" })
  productId: string;

  @Column({ type: "uuid" })
  unitId: string;

  @Column(BaseFactorNumericColumnOptions)
  conversionRate: number;

  @Column(BaseNumericColumnOptions)
  pricePerUnit: number;

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => Attribute, { onDelete: "CASCADE" })
  @JoinColumn({ name: "unitId" })
  unit: Attribute | null;

  @ManyToOne(() => Product, (product) => product.extraUnits, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "productId" })
  product: Product;
}
