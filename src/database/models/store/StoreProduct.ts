import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { StoreEntity } from "./StoreEntity";
import { Product } from "../Product";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";

@Entity("store_products")
export class StoreProduct extends StoreEntity {
  @Column({ type: "uuid" })
  productId: string;
  @ManyToOne(() => Product, (p) => p.storeProducts, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product: Product;

  @Column(BaseNumericColumnOptions)
  costPrice: number; // Giá vốn tại cửa hàng

  @Column({ type: "boolean", default: false })
  isSelling: boolean; // Đang bán tại cửa hàng

  @Column({ type: "varchar", length: 255, nullable: true })
  location: string | null; // Vị trí kho/kệ
}
