import { Entity, Column, ManyToOne, JoinColumn, ManyToMany } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { Attribute } from "./Attribute";
import { Product } from "./Product";
import { ProductVariant } from "./ProductVariant";

@Entity("product_options")
export class ProductOption extends BaseEntity {
  @Column({ type: "uuid" })
  productId!: string;

  @Column({ type: "uuid" })
  typeId!: string;

  @Column({ type: "varchar", length: 255 })
  value!: string;

  @Column({ type: "int", default: 0 })
  typeIndex!: number;

  // * ======================== RELATIONS ========================= * //
  @ManyToOne(() => Product, (product) => product.options, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "productId" })
  product: Product;

  @ManyToOne(() => Attribute, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "typeId" })
  type: Attribute;

  @ManyToMany(() => ProductVariant, (variant) => variant.options)
  variants: ProductVariant[];
}
