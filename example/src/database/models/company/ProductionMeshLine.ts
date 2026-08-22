import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import {
  BaseEntity,
  BaseNumericColumnOptions,
  BaseQuantityNumericColumnOptions,
  BaseNullableNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { Production } from "./Production";
import { Product, ProductSnapshot } from "./Product";
import { MeshSpecLine } from "./MeshSpecLine";
import { OrderLine } from "./OrderLine";

@Entity("production_mesh_lines")
export class ProductionMeshLine extends BaseEntity {
  @Column({ type: "uuid" })
  productionId: string;

  // Dòng nguồn từ đơn hàng (nếu có)
  @Column({ type: "uuid", nullable: true, default: null })
  orderLineId: string | null;

  // Dòng nguồn từ phiếu thông số lưới
  @Column({ type: "uuid", nullable: true, default: null })
  meshSpecLineId: string | null;

  // Thành phẩm
  @Column({ type: "uuid", nullable: true, default: null })
  productId: string | null;

  @Column({ type: "jsonb", nullable: true, default: null })
  productSnapshot: ProductSnapshot | null;

  // ====================== THÔNG TIN LƯỚI ======================

  // Khu vực
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  area: string | null;

  // Tên lưới
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  meshName: string | null;

  // Số lượng tấm/cuộn
  @Column(BaseQuantityNumericColumnOptions)
  quantity: number;

  // Kích thước (mm)
  @Column(BaseQuantityNumericColumnOptions)
  length: number;

  @Column(BaseQuantityNumericColumnOptions)
  width: number;

  // ====================== THANH DÀI ======================

  @Column(BaseNumericColumnOptions)
  lengthPhi: number;

  // Dung sai phi thanh dài
  @Column(BaseNullableNumericColumnOptions)
  lengthPhiTolerance: number | null;

  // Phi thực tế sản xuất
  // = lengthPhi - lengthPhiTolerance
  @Column(BaseNumericColumnOptions)
  actualLengthPhi: number;

  // Pattern khoảng cách thanh dài
  @Column({ type: "jsonb", default: () => "'[]'" })
  lengthSpacingPattern: number[];

  @Column(BaseNumericColumnOptions)
  lengthLeft: number;

  @Column(BaseNumericColumnOptions)
  lengthRight: number;

  // ====================== THANH RỘNG ======================

  @Column(BaseNumericColumnOptions)
  widthPhi: number;

  // Dung sai phi thanh rộng
  @Column(BaseNullableNumericColumnOptions)
  widthPhiTolerance: number | null;

  // Phi thực tế sản xuất
  // = widthPhi - widthPhiTolerance
  @Column(BaseNumericColumnOptions)
  actualWidthPhi: number;

  @Column({ type: "jsonb", default: () => "'[]'" })
  widthSpacingPattern: number[];

  @Column(BaseNumericColumnOptions)
  widthLeft: number;

  @Column(BaseNumericColumnOptions)
  widthRight: number;

  // ====================== THỐNG KÊ ======================

  // Tổng số thanh dài
  // = calculateBarCount(length, lengthLeft, lengthRight, lengthSpacingPattern) * quantity nếu widthSpacing > 0
  @Column(BaseQuantityNumericColumnOptions)
  totalLengthBarCount: number;

  // Tổng số thanh rộng
  // = calculateBarCount(width, widthLeft, widthRight, widthSpacingPattern) * quantity nếu lengthSpacing > 0
  @Column(BaseQuantityNumericColumnOptions)
  totalWidthBarCount: number;

  // Tổng khối lượng (Kg)
  // = (length * totalLengthBarCount * actualLengthPhi/4 * STEEL_WEIGHT_FACTOR + width * totalWidthBarCount * actualWidthPhi/4 * STEEL_WEIGHT_FACTOR) / 1000
  @Column(BaseNumericColumnOptions)
  totalWeight: number;

  // Tổng diện tích (m²)
  // = length * width * quantity / 1_000_000
  @Column(BaseNumericColumnOptions)
  totalArea: number;

  // ====================== RELATIONS ======================

  @ManyToOne(() => Production, (production) => production.meshLines, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "productionId" })
  production: Production;

  @ManyToOne(() => OrderLine, { onDelete: "SET NULL" })
  @JoinColumn({ name: "orderLineId" })
  orderLine: OrderLine | null;

  @ManyToOne(() => MeshSpecLine, {
    onDelete: "SET NULL",
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: "meshSpecLineId" })
  meshSpecLine: MeshSpecLine | null;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product: Product | null;
}
