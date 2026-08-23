import {
  BaseEntity,
  BaseFactorNumericColumnOptions,
  BaseNumericColumnOptions,
  BaseSortOrderColumnOptions,
} from "@/shared/base/BaseEntity";
import { Column, Entity, ManyToOne, JoinColumn } from "typeorm";
import { StoreTransfer } from "./StoreTransfer";
import { Product, ProductSnapshot } from "./Product";
import { Attribute, AttributeSnapshot } from "./Attribute";

@Entity("store_transfer_lines")
export class StoreTransferLine extends BaseEntity {
  @Column({ type: "uuid" })
  transferId: string;
  @ManyToOne(() => StoreTransfer, (t) => t.lines, { onDelete: "CASCADE" })
  @JoinColumn({ name: "transferId" })
  transfer: StoreTransfer;

  @Column({ type: "uuid", nullable: true, default: null })
  productId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  productSnapshot: ProductSnapshot;
  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product: Product;

  @Column({ type: "uuid", nullable: true, default: null })
  unitId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  unitSnapshot: AttributeSnapshot | null;
  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "unitId" })
  unit: Attribute | null;

  @Column(BaseFactorNumericColumnOptions)
  conversionRateAtTime: number;

  // Số lượng chuyển
  @Column(BaseNumericColumnOptions)
  quantity: number;

  // Phí chênh lệch giá vốn giữa 2 cửa hàng, = quantity * (toStoreCostPrice - fromStoreCostPrice)
  @Column(BaseNumericColumnOptions)
  differenceCostPriceAmount: number;
}
