import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import {
  BaseEntity,
  BaseNumericColumnOptions,
  BaseQuantityNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { PurchaseQuotation } from "./PurchaseQuotation";
import { Product, ProductSnapshot } from "./Product";
import { Attribute, AttributeSnapshot } from "../Attribute";

@Entity("purchase_quotation_lines")
export class PurchaseQuotationLine extends BaseEntity {
  @Column({ type: "uuid" })
  purchaseQuotationId: string;

  @Column({ type: "uuid", nullable: true, default: null })
  productId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  productSnapshot: ProductSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  unitId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  unitSnapshot: AttributeSnapshot | null;

  @Column(BaseQuantityNumericColumnOptions)
  quantity: number;

  @Column(BaseNumericColumnOptions)
  unitPrice: number;

  @Column(BaseNumericColumnOptions)
  taxRate: number;

  @Column(BaseNumericColumnOptions)
  subTotal: number;

  @Column(BaseNumericColumnOptions)
  taxAmount: number; // Số tiền thuế của dòng này (subTotal * taxRate)

  @Column(BaseNumericColumnOptions)
  grossAmount: number; // Số tiền sau thuế (subTotal + taxAmount)

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(
    () => PurchaseQuotation,
    (purchaseQuotation) => purchaseQuotation.lines,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "purchaseQuotationId" })
  purchaseQuotation: PurchaseQuotation;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product: Product | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "unitId" })
  unit: Attribute | null;
}
