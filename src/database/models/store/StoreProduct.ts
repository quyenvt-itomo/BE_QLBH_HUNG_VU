import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { StoreEntity } from "./StoreEntity";
import { Product } from "../Product";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { StoreProductLocation } from "./StoreProductLocation";

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

  /** Một sản phẩm tại một chi nhánh có thể nằm ở nhiều vị trí. */
  @OneToMany(() => StoreProductLocation, (item) => item.storeProduct, {
    cascade: ["insert", "update"],
  })
  locations: StoreProductLocation[];
}
