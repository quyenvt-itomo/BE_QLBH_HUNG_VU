import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Attribute } from "../Attribute";
import { Product } from "./Product";

@Entity("product_price_histories")
export class ProductPriceHistory extends BaseEntity {
  @Column({ type: "uuid" })
  productId: string;

  @Column({ type: "uuid" })
  unitId: string;

  @Column(BaseNumericColumnOptions)
  pricePerUnit: number;

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => Attribute, { onDelete: "CASCADE" })
  @JoinColumn({ name: "unitId" })
  unit: Attribute | null;

  @ManyToOne(() => Product, (product) => product.priceHistories, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "productId" })
  product: Product;
}
