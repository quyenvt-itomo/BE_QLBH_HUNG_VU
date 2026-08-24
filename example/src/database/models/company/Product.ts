import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { BaseEntityWithStore } from "./BaseEntityWithStore";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Attribute } from "../Attribute";
import { ProductExtraUnit } from "./ProductExtraUnit";
import { ProductPriceHistory } from "./ProductPriceHistory";
export enum ProductType {
  FINISHED = "finished", // Thành phẩm
  MAIN_MATERIAL = "main_material", // Nguyên vật liệu chính
  SUB_MATERIAL = "sub_material", // Nguyên vật liệu phụ
}
export interface ProductSnapshot {
  id: string;
  code: string;
  name: string;
}
export interface StockMetadata {
  total: {
    quantity: number;
    value: number;
  };
  byWarehouse: Record<
    string,
    {
      quantity: number;
      value: number;
    }
  >;
}

@Entity("products")
export class Product extends BaseEntityWithStore {
  @Column({ type: "enum", enum: ProductType })
  type: ProductType;
  @Column({ type: "uuid", nullable: true, default: null })
  groupId: string | null;
  @Column({ type: "varchar", length: 20 })
  code: string;
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "uuid", nullable: true, default: null })
  baseUnitId: string | null;

  @Column(BaseNumericColumnOptions)
  price: number;

  @Column(BaseNumericColumnOptions)
  taxRate: number;

  @Column({
    type: "jsonb",
    nullable: true,
    default: () =>
      '\'{"total":{"quantity":0,"value":0},"byWarehouse":{}}\'::jsonb',
  })
  stockMetadata?: StockMetadata;

  @Column({ type: "boolean", default: false })
  isPublic: boolean; // Hiển thị công khai hay không

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "baseUnitId" })
  baseUnit: Attribute | null;
  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "groupId" })
  group: Attribute | null;

  // * Đơn vị quy đổi
  @OneToMany(() => ProductExtraUnit, (extraUnit) => extraUnit.product, {
    cascade: true,
  })
  extraUnits: ProductExtraUnit[];

  // * Lịch sử giá
  @OneToMany(
    () => ProductPriceHistory,
    (priceHistory) => priceHistory.product,
    { cascade: true },
  )
  priceHistories: ProductPriceHistory[];
}
