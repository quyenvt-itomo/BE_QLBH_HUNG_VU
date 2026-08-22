import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import {
  BaseEntity,
  BaseQuantityNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { QuotationRequest } from "./QuotationRequest";
import { Product, ProductSnapshot } from "./Product";
import { Attribute, AttributeSnapshot } from "../Attribute";

@Entity("quotation_request_lines")
export class QuotationRequestLine extends BaseEntity {
  @Column({ type: "uuid" })
  quotationRequestId: string;

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

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(
    () => QuotationRequest,
    (quotationRequest) => quotationRequest.lines,
    {
      onDelete: "CASCADE",
    },
  )
  @JoinColumn({ name: "quotationRequestId" })
  quotationRequest: QuotationRequest;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product: Product | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "unitId" })
  unit: Attribute | null;
}
