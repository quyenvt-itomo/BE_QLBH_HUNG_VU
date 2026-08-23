import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
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
  total: { qty: number; value: number };
  byStore: Record<string, { qty: number; value: number }>;
}

@Entity("products")
export class Product extends BaseEntity {
  @Column({ type: "uuid", nullable: true, default: null })
  groupId: string | null;
  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "groupId" })
  group: Attribute | null;

  @Column({ type: "varchar", length: 20 })
  code: string;
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "uuid", nullable: true, default: null })
  baseUnitId: string | null;
  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "baseUnitId" })
  baseUnit: Attribute | null;

  @Column(BaseNumericColumnOptions)
  salePrice: number; // Giá bán/ĐVT cơ bản

  @Column({
    type: "jsonb",
    default: () => '\'{"total":{"qty":0,"value":0},"byStore":{}}\'::jsonb',
  })
  stockMetadata: StockMetadata;

  @Column({ type: "boolean", default: false })
  isSaling: boolean; // * Đang bán

  // * Đơn vị quy đổi
  @OneToMany(() => ProductExtraUnit, (eu) => eu.product, { cascade: true })
  extraUnits: ProductExtraUnit[];

  // * Lịch sử giá vốn
  @OneToMany(() => ProductPriceHistory, (ph) => ph.product, { cascade: true })
  priceHistories: ProductPriceHistory[];

  // * Thông tin tại các cửa hàng
  @OneToMany(() => StoreProduct, (sp) => sp.product)
  storeProducts: StoreProduct[];
}
