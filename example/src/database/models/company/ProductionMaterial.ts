import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import {
  BaseEntity,
  BaseNullableNumericColumnOptions,
  BaseNumericColumnOptions,
  BaseQuantityNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { Production } from "./Production";
import { Product, ProductSnapshot } from "./Product";
import { Attribute } from "../Attribute";

export enum PackingTypeEnum {
  COIL = "COIL", // Cuộn - Tính theo Kg
  BUNDLE = "BUNDLE", // Bó - Tính theo thanh
}

@Entity("production_materials")
export class ProductionMaterial extends BaseEntity {
  @Column({ type: "uuid" })
  productionId: string;

  @Column({ type: "uuid", nullable: true, default: null })
  productId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  productSnapshot: ProductSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  materialId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  materialSnapshot: ProductSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  unitId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  unitSnapshot: ProductSnapshot | null;

  @Column(BaseQuantityNumericColumnOptions)
  quantity: number;

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => Production, (production) => production.materials, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "productionId" })
  production: Production;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product: Product | null;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "materialId" })
  material: Product | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "unitId" })
  unit: Attribute | null;
}
