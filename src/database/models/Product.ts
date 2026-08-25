import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import {
  BaseEntity,
  BaseNullableNumericColumnOptions,
  BaseNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { Attribute } from "./Attribute";
import { ProductExtraUnit } from "./ProductExtraUnit";
import { ProductPriceHistory } from "./store/ProductPriceHistory";
import { StoreProduct } from "./store/StoreProduct";

export interface ProductSnapshot {
  id: string;
  code: string;
  name: string;
}
export interface StockMetadata {
  total: { quantity: number; value: number };
  byStore: Record<string, { quantity: number; value: number }>;
}
export enum WeightUnit {
  g = "g",
  kg = "kg",
}

@Entity("products")
export class Product extends BaseEntity {
  @Column({ type: "varchar", length: 20 })
  code: string;
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  barcode: string | null;
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text", nullable: true, default: null })
  description: string | null;

  @Column({ type: "uuid", nullable: true, default: null })
  groupId: string | null;
  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "groupId" })
  group: Attribute | null;

  @Column({ type: "uuid", nullable: true, default: null })
  brandId: string | null;
  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "brandId" })
  brand: Attribute | null;

  @Column({ type: "uuid", nullable: true, default: null })
  baseUnitId: string | null;
  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "baseUnitId" })
  baseUnit: Attribute | null;

  @Column(BaseNullableNumericColumnOptions)
  salePrice: number | null; // Giá bán/ĐVT cơ bản

  // Trọng lượng
  @Column(BaseNullableNumericColumnOptions)
  weight: number | null; // Trọng lượng/ĐVT cơ bản
  // ĐVT trọng lượng
  @Column({ type: "varchar", length: 10, default: WeightUnit.g })
  weightUnit: WeightUnit; // ĐVT trọng lượng/ĐVT cơ bản

  @Column({
    type: "jsonb",
    default: () => '\'{"total":{"quantity":0,"value":0},"byStore":{}}\'::jsonb',
  })
  stockMetadata: StockMetadata;

  // * Đơn vị quy đổi
  @OneToMany(() => ProductExtraUnit, (eu) => eu.product, { cascade: true })
  extraUnits: ProductExtraUnit[];

  // * Lịch sử giá vốn
  // Price history is accounting/reporting data. Never cascade-delete it with a product.
  @OneToMany(() => ProductPriceHistory, (ph) => ph.product, {
    cascade: ["insert", "update"],
  })
  priceHistories: ProductPriceHistory[];

  // * Thông tin tại các cửa hàng
  @OneToMany(() => StoreProduct, (sp) => sp.product)
  storeProducts: StoreProduct[];

  // TODO: More fields
  stockQuantity?: number;
  stockValue?: number;
}
