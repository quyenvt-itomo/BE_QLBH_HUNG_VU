import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Product } from "./Product";
import { ProductOption } from "./ProductOption";

export interface StockMetadata {
  total: {
    qty: number;
    value: number;
  };
  byStore: Record<
    string,
    {
      qty: number;
      value: number;
    }
  >;
}

@Entity("product_variants")
export class ProductVariant extends BaseEntity {
  @Column({ type: "uuid" })
  productId: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  sku: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  barcode: string | null;

  @Column(BaseNumericColumnOptions)
  costPrice: number;

  @Column(BaseNumericColumnOptions)
  price: number;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  /**
   * 🚀 Denormalized stock data for high-performance queries
   * Updated automatically after stock_trackings changes
   * Structure: { total: { qty, value }, byStore: { [storeId]: { qty, value } } }
   */
  @Column({
    type: "jsonb",
    nullable: true,
    default: () => '\'{"total":{"qty":0,"value":0},"byStore":{}}\'::jsonb',
  })
  stockMetadata?: StockMetadata;

  // * ======================== RELATIONS ========================= * //
  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "productId" })
  product: Product;

  @ManyToMany(() => ProductOption, (option) => option.variants, {
    onDelete: "CASCADE",
  })
  @JoinTable({
    name: "product_variants_options_product_options",
    joinColumn: {
      name: "productVariantsId",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "productOptionsId",
      referencedColumnName: "id",
    },
  })
  options: ProductOption[];
}
