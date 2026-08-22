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

export enum PackingTypeEnum {
  COIL = "COIL", // Cuộn
  BUNDLE = "BUNDLE", // Bó
}

@Entity("production_steel_drawing_lines")
export class ProductionSteelDrawingLine extends BaseEntity {
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

  // ====================== QUY CÁCH ĐÓNG ======================

  @Column({
    type: "varchar",
    length: 20,
  })
  packingType: PackingTypeEnum;

  // Đơn vị đóng
  @Column({ type: "uuid", nullable: true, default: null })
  unitId: string | null;

  @Column({ type: "jsonb", nullable: true, default: null })
  unitSnapshot: AttributeSnapshot | null;

  // ====================== THÔNG TIN THÉP ======================

  // Phi đặt
  @Column(BaseNullableNumericColumnOptions)
  phi: number | null;

  // Dung sai phi
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  phiTolerance: string | null;

  // Chiều dài thanh (mm)
  // Chỉ dùng cho BUNDLE
  @Column(BaseNullableNumericColumnOptions)
  size: number | null;

  // Dung cắt (mm)
  @Column(BaseNullableNumericColumnOptions)
  cutTolerance: number | null;

  // Số lượng / đơn vị tính
  // Cuộn = kg/cuộn
  // Bó = thanh/bó
  @Column(BaseNullableNumericColumnOptions)
  quantityPerUnit: number | null;

  // Số lượng bó/cuộn
  @Column(BaseQuantityNumericColumnOptions)
  quantity: number;

  // Đơn trọng (Kg/m)
  // = phi²/4 * STEEL_WEIGHT_FACTOR
  @Column(BaseNullableNumericColumnOptions)
  unitWeight: number | null;

  // Tổng khối lượng
  @Column(BaseNumericColumnOptions)
  totalWeight: number;

  // ====================== RELATIONS ======================

  @ManyToOne(() => Production, (production) => production.steelDrawingLines, {
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
