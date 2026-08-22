import {
  BaseEntity,
  BaseNumericColumnOptions,
  BaseSortOrderColumnOptions,
} from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { InventoryAdjustment } from "./InventoryAdjustment";
import { Product } from "./Product";
import { TransactionTypeEnum } from "@/shared/constants/enum";

@Entity("inventory_adjustment_lines")
export class InventoryAdjustmentLine extends BaseEntity {
  @Column({ type: "uuid" })
  adjustmentId: string;

  @Column({ type: "uuid" })
  productId: string;

  @Column(BaseNumericColumnOptions)
  expectedQuantity: number; // số lượng tồn kho điều chỉnh

  @Column(BaseNumericColumnOptions)
  countedQuantity: number; // số lượng hệ thống đếm được

  @Column(BaseNumericColumnOptions)
  deltaQuantity: number;

  @Column({
    type: "enum",
    enum: TransactionTypeEnum,
    default: TransactionTypeEnum.IN,
  })
  type: TransactionTypeEnum;

  @Column(BaseNumericColumnOptions)
  costPriceAtTime: number;

  @Column(BaseNumericColumnOptions)
  adjustmentValue: number; // nếu là tăng: = deltaQuantity * costPriceAtTime, nếu là giảm: tính theo giá bình quân tại thời điểm phát sinh

  @Column(BaseSortOrderColumnOptions)
  sortOrder: number;

  // * ======================== RELATIONS ========================= //
  @ManyToOne(() => InventoryAdjustment, (adj) => adj.lines, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "adjustmentId" })
  adjustment: InventoryAdjustment;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product: Product;
}
