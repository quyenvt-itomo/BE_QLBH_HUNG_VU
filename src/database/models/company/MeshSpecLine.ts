import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import {
  BaseEntity,
  BaseNumericColumnOptions,
  BaseQuantityNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { MeshSpec } from "./MeshSpec";
import { Product, ProductSnapshot } from "./Product";

@Entity("mesh_spec_lines")
export class MeshSpecLine extends BaseEntity {
  @Column({ type: "uuid" })
  meshSpecId: string;

  @Column({ type: "uuid", nullable: true, default: null })
  productId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  productSnapshot: ProductSnapshot | null;

  // Tên khu vực
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  area: string | null;

  // Tên lưới
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  meshName: string | null;

  // Số lượng
  @Column(BaseQuantityNumericColumnOptions)
  quantity: number;

  // Chiều dài lưới
  @Column(BaseQuantityNumericColumnOptions)
  length: number;

  // Phi theo chiều dài
  @Column(BaseNumericColumnOptions)
  lengthPhi: number;

  // Vòng lặp để cấu hình khoảng cách các thanh dài
  // Ví dụ [200, 300] nghĩa là sau khi trừ trái, phải, thanh 2 cách thanh 1 200, thanh 3 cách thanh 2 300, sau đó lặp lại pattern này cho đến hết chiều dài
  @Column({ type: "jsonb", default: () => "'[]'" })
  lengthSpacingPattern: number[];

  // Chìa trái/phải theo chiều dài
  @Column(BaseNumericColumnOptions)
  lengthLeft: number;
  @Column(BaseNumericColumnOptions)
  lengthRight: number;

  // Chiều rộng lưới
  @Column(BaseQuantityNumericColumnOptions)
  width: number;

  // Phi theo chiều rộng
  @Column(BaseNumericColumnOptions)
  widthPhi: number;

  // Vòng lặp để cấu hình khoảng cách các thanh rộng
  // Cách tính tương tự lengthSpacingPattern nhưng theo chiều rộng
  @Column({ type: "jsonb", default: () => "'[]'" })
  widthSpacingPattern: number[] | null;

  // Chìa trái/phải theo chiều rộng
  @Column(BaseNumericColumnOptions)
  widthLeft: number;
  @Column(BaseNumericColumnOptions)
  widthRight: number;

  // TODO: Thống kê
  // Tổng số thanh dài
  // = calculateBarCount(length, lengthLeft, lengthRight, lengthSpacingPattern) * quantity nếu widthSpacing > 0
  @Column(BaseQuantityNumericColumnOptions)
  totalLengthBarCount: number;

  // Tổng số thanh rộng
  // = calculateBarCount(width, widthLeft, widthRight, widthSpacingPattern) * quantity nếu lengthSpacing > 0
  @Column(BaseQuantityNumericColumnOptions)
  totalWidthBarCount: number;

  // Tổng khối lượng
  // = (length * totalLengthBarCount * lengthPhi²/4 * STEEL_WEIGHT_FACTOR + width * totalWidthBarCount * widthPhi²/4 * STEEL_WEIGHT_FACTOR) / 1000
  @Column(BaseNumericColumnOptions)
  totalWeight: number;

  // Tổng diện tích (m²)
  // = length * width * quantity / 1_000_000
  @Column(BaseNumericColumnOptions)
  totalArea: number;

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => MeshSpec, (meshSpec) => meshSpec.lines, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "meshSpecId" })
  meshSpec: MeshSpec;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product: Product | null;
}
