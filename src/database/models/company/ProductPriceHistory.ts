import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import {
  BaseEntity,
  BaseNumericColumnOptions,
} from "@/shared/base/BaseEntity";
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

  /** Giá mới - giá cũ của chính đơn vị tính này. */
  @Column(BaseNumericColumnOptions)
  priceDifference: number;

  /** Chỉ lịch sử của ĐVT base mới được dùng để điều chỉnh tồn kho. */
  @Column({ type: "boolean", default: false })
  isBaseUnit: boolean;

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
