import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { StoreEntity } from "./StoreEntity";
import { Product } from "../Product";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Attribute } from "../Attribute";

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

  @Column({ type: "uuid", nullable: true, default: null })
  locationId: string | null; // Vị trí kho/kệ
  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "locationId" })
  location: Attribute | null;
}
