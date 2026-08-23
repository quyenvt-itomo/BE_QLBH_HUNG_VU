import {
  BaseEntity,
  BaseNumericColumnOptions,
  BaseSortOrderColumnOptions,
} from "@/shared/base/BaseEntity";
import { Column, Entity, ManyToOne, JoinColumn } from "typeorm";
import { StoreTransfer } from "./StoreTransfer";
import { ProductVariant } from "./ProductVariant";
import { Attribute } from "./Attribute";
import { ProductVariantSnapshot } from "@/modules/product";

@Entity("store_transfer_lines")
export class StoreTransferLine extends BaseEntity {
  @Column({ type: "uuid" })
  transferId: string;

  @Column({ type: "uuid" })
  productVariantId: string;
  @Column({ type: "jsonb" })
  productVariantSnapshot: ProductVariantSnapshot;

  // Số lượng chuyển
  @Column(BaseNumericColumnOptions)
  quantity: number;

  @Column(BaseSortOrderColumnOptions)
  sortOrder: number;

  // * ========================= RELATIONS ========================= * //
  @ManyToOne(() => StoreTransfer, (transfer) => transfer.lines, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "transferId" })
  transfer: StoreTransfer;

  @ManyToOne(() => Attribute, {
    onDelete: "SET NULL",
  })
  @ManyToOne(() => ProductVariant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productVariantId" })
  productVariant: ProductVariant;
}
