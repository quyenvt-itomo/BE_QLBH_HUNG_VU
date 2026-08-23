import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Product } from "../Product";
import { StoreEntity } from "./StoreEntity";

@Entity("product_price_histories")
export class ProductPriceHistory extends StoreEntity {
  @Column({ type: "varchar", length: 20 })
  code: string; // mã phiếu

  @Column({ type: "uuid", nullable: true, default: null })
  productId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  productSnapshot: { id: string; code: string; name: string } | null;
  @ManyToOne(() => Product, (p) => p.priceHistories, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product: Product | null;

  @Column(BaseNumericColumnOptions)
  costPrice: number; // Giá vốn/ĐVT cơ bản

  @Column(BaseNumericColumnOptions)
  deltaCostPrice: number; // = costPrice - costPriceBefore, có dấu: +tăng, -giảm
}
