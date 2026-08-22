import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import {
  BaseEntity,
  BaseNullableNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { ProductOption } from "./ProductOption";
import { ProductVariant, StockMetadata } from "./ProductVariant";
import { Attribute } from "./Attribute";

@Entity("products")
export class Product extends BaseEntity {
  @Column({ type: "varchar" })
  name!: string;
  @Column({ type: "varchar" })
  code!: string;

  @Column({ type: "uuid", nullable: true, default: null })
  categoryId!: string | null;

  @Column({ type: "uuid", nullable: true, default: null })
  unitId!: string | null;

  @Column({ type: "boolean", default: true })
  hasVariant: boolean;

  @Column(BaseNullableNumericColumnOptions)
  taxRate: number | null;

  @Column({
    type: "jsonb",
    nullable: true,
    default: () => '\'{"total":{"qty":0,"value":0},"byStore":{}}\'::jsonb',
  })
  stockMetadata?: StockMetadata;

  // * ======================== RELATIONS ========================= * //
  @ManyToOne(() => Attribute, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "categoryId" })
  category: Attribute;
  @ManyToOne(() => Attribute, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "unitId" })
  unit: Attribute;

  @OneToMany(() => ProductOption, (option) => option.product, {
    cascade: true,
  })
  options: ProductOption[];

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];
}
