import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import {
  BaseEntity,
  BaseNumericColumnOptions,
  BaseNullableNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { InventoryConversion } from "./InventoryConversion";
import { Product, ProductSnapshot } from "./Product";

/**
 * Dòng phiếu chuyển mã — mỗi dòng = 1 cặp fromProduct → toProduct.
 * Có thể có nhiều dòng trong 1 phiếu (1 phiếu chuyển nhiều mã).
 */
@Entity("inventory_conversion_lines")
export class InventoryConversionLine extends BaseEntity {
  @Column({ type: "uuid" })
  inventoryConversionId: string;

  // =====================================================
  // SẢN PHẨM NGUỒN (FROM)
  // =====================================================
  @Column({ type: "uuid" })
  fromProductId: string;
  @Column({ type: "jsonb", nullable: true, default: null })
  fromProductSnapshot: ProductSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  fromUnitId: string | null;

  @Column({ ...BaseNumericColumnOptions, default: 0 })
  fromQuantity: number;

  // =====================================================
  // SẢN PHẨM ĐÍCH (TO)
  // =====================================================
  @Column({ type: "uuid" })
  toProductId: string;
  @Column({ type: "jsonb", nullable: true, default: null })
  toProductSnapshot: ProductSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  toUnitId: string | null;

  @Column({ ...BaseNumericColumnOptions, default: 0 })
  toQuantity: number;

  // =====================================================
  // SỐ LƯỢNG CHUYỂN ĐỔI (quy về đơn vị gốc)
  // =====================================================
  @Column(BaseNullableNumericColumnOptions)
  quantity: number | null;

  // =====================================================
  // RELATIONS
  // =====================================================
  @ManyToOne(
    () => InventoryConversion,
    (inventoryConversion) => inventoryConversion.lines,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "inventoryConversionId" })
  inventoryConversion: InventoryConversion;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "fromProductId" })
  fromProduct: Product | null;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "toProductId" })
  toProduct: Product | null;
}
