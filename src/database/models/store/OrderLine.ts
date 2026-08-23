import {
  BaseEntity,
  BaseFactorNumericColumnOptions,
  BaseNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Order } from "./Order";
import { Product, ProductSnapshot } from "../Product";
import { Attribute, AttributeSnapshot } from "../Attribute";

@Entity("order_lines")
export class OrderLine extends BaseEntity {
  @Column({ type: "uuid", nullable: true, default: null })
  orderId: string | null;
  @ManyToOne(() => Order, (order) => order.lines, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId" })
  order: Order | null;

  @Column({ type: "uuid", nullable: true, default: null })
  returnOrderId: string | null;
  @ManyToOne(() => Order, (order) => order.returnLines, { onDelete: "CASCADE" })
  @JoinColumn({ name: "returnOrderId" })
  returnOrder: Order | null;

  // For returns, reference to original line
  @Column({ type: "uuid", nullable: true, default: null })
  refOrderLineId: string | null; // dòng gốc bị hoàn
  @ManyToOne(() => OrderLine, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "refOrderLineId" })
  refOrderLine?: OrderLine | null;

  @Column({ type: "uuid", nullable: true, default: null })
  productId: string | null;
  @Column({ type: "jsonb" })
  productSnapshot: ProductSnapshot;
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

  @Column(BaseNumericColumnOptions)
  unitPrice: number;
  @Column(BaseNumericColumnOptions)
  quantity: number;

  @Column(BaseNumericColumnOptions)
  subTotal: number;

  @Column(BaseNumericColumnOptions)
  totalCost: number;

  /** Cost snapshot used by reports after the product itself is removed. */
  @Column(BaseNumericColumnOptions)
  costPriceAtTime: number;
}
