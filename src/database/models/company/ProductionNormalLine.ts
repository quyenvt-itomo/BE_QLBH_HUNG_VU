import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import {
  BaseEntity,
  BaseNullableNumericColumnOptions,
  BaseNumericColumnOptions,
  BaseQuantityNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { Production } from "./Production";
import { Product, ProductSnapshot } from "./Product";
import { Attribute, AttributeSnapshot } from "../Attribute";
import { OrderLine } from "./OrderLine";

@Entity("production_normal_lines")
export class ProductionNormalLine extends BaseEntity {
  @Column({ type: "uuid" })
  productionId: string;

  // Dòng nguồn từ đơn hàng (nếu có)
  @Column({ type: "uuid", nullable: true, default: null })
  orderLineId: string | null;

  // Thành phẩm
  @Column({ type: "uuid", nullable: true, default: null })
  productId: string | null;

  @Column({ type: "jsonb", nullable: true, default: null })
  productSnapshot: ProductSnapshot | null;

  // Quy cách đóng (custom text)
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  packingSpec: string | null;

  // Đơn vị đóng
  @Column({ type: "uuid", nullable: true, default: null })
  unitId: string | null;

  @Column({ type: "jsonb", nullable: true, default: null })
  unitSnapshot: AttributeSnapshot | null;

  // SL / ĐVT
  @Column(BaseNullableNumericColumnOptions)
  quantityPerUnit: number | null;

  // Số lượng
  @Column(BaseQuantityNumericColumnOptions)
  quantity: number;

  // Khối lượng
  @Column(BaseNumericColumnOptions)
  totalWeight: number;

  // ====================== RELATIONS ======================

  @ManyToOne(() => Production, (production) => production.normalLines, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "productionId" })
  production: Production;

  @ManyToOne(() => OrderLine, { onDelete: "SET NULL" })
  @JoinColumn({ name: "meshSpecLineId" })
  orderLine: OrderLine | null;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product: Product | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "unitId" })
  unit: Attribute | null;
}
