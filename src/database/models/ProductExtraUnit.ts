import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import {
  BaseEntity,
  BaseFactorNumericColumnOptions,
  BaseNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { Attribute } from "./Attribute";
import { Product } from "./Product";

@Entity("product_extra_units")
export class ProductExtraUnit extends BaseEntity {
  @Column({ type: "uuid" })
  productId: string;
  @ManyToOne(() => Product, (p) => p.extraUnits, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product: Product;

  @Column({ type: "uuid" })
  unitId: string;
  @ManyToOne(() => Attribute, { onDelete: "CASCADE" })
  @JoinColumn({ name: "unitId" })
  unit: Attribute | null;

  @Column(BaseFactorNumericColumnOptions)
  conversionRate: number;

  @Column(BaseNumericColumnOptions)
  salePrice: number; // Giá bán/ĐVT quy đổi

  // Là đơn vị tính nhập hàng mặc định
  @Column({ type: "boolean", default: false })
  isPurchaseUnit: boolean;
}
