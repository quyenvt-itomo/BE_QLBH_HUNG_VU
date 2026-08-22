import {
  BaseEntity,
  BaseNumericColumnOptions,
  BaseSortOrderColumnOptions,
} from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { InventoryAdjustment } from "./InventoryAdjustment";
import { ProductVariant } from "../ProductVariant";
import { InventoryTransactionTypeEnum } from "@/shared/constants/enum";

@Entity("inventory_adjustment_lines")
export class InventoryAdjustmentLine extends BaseEntity {
  @Column({ type: "uuid" })
  adjustmentId!: string;

  @Column({ type: "uuid" })
  productVariantId!: string;

  @Column(BaseNumericColumnOptions)
  expectedQty!: number; // số lượng tồn kho điều chỉnh

  @Column(BaseNumericColumnOptions)
  countedQty!: number; // số lượng hệ thống đếm được

  @Column(BaseNumericColumnOptions)
  deltaQty!: number;

  @Column({
    type: "enum",
    enum: InventoryTransactionTypeEnum,
    default: InventoryTransactionTypeEnum.IN,
  })
  direction!: InventoryTransactionTypeEnum;

  @Column(BaseNumericColumnOptions)
  costPriceAtTime!: number;

  @Column(BaseNumericColumnOptions)
  adjustmentValue!: number; // nếu là tăng: = deltaQty * costPriceAtTime, nếu là giảm: tính theo giá bình quân tại thời điểm phát sinh

  @Column(BaseSortOrderColumnOptions)
  sortOrder: number;

  // * ======================== RELATIONS ========================= //
  @ManyToOne(() => InventoryAdjustment, (adj) => adj.lines, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "adjustmentId" })
  adjustment: InventoryAdjustment;

  @ManyToOne(() => ProductVariant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productVariantId" })
  productVariant: ProductVariant;
}
