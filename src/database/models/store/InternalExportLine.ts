import {
  BaseEntity,
  BaseFactorNumericColumnOptions,
  BaseQuantityNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { InternalExport } from "./InternalExport";
import { Product, ProductSnapshot } from "../Product";
import { Attribute, AttributeSnapshot } from "../Attribute";

@Entity("internal_export_lines")
export class InternalExportLine extends BaseEntity {
  @Column({ type: "uuid" })
  internalExportId: string;

  @ManyToOne(() => InternalExport, (internalExport) => internalExport.lines, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "internalExportId" })
  internalExport: InternalExport;

  @Column({ type: "uuid" })
  productId: string | null;

  @Column({ type: "jsonb", nullable: true, default: null })
  productSnapshot: ProductSnapshot | null;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product: Product | null;

  @Column({ type: "uuid", nullable: true, default: null })
  unitId: string | null;

  @Column({ type: "jsonb", nullable: true, default: null })
  unitSnapshot: AttributeSnapshot | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "unitId" })
  unit: Attribute | null;

  @Column(BaseFactorNumericColumnOptions)
  conversionRateAtTime: number;

  @Column(BaseQuantityNumericColumnOptions)
  quantity: number;
}
