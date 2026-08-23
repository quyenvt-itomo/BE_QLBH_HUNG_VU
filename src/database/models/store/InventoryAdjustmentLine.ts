import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { InventoryAdjustment } from "./InventoryAdjustment";
import { Product, ProductSnapshot } from "../Product";

@Entity("inventory_adjustment_lines")
export class InventoryAdjustmentLine extends BaseEntity {
  @Column({ type: "uuid" })
  adjustmentId: string;
  @ManyToOne(() => InventoryAdjustment, (adj) => adj.lines, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "adjustmentId" })
  adjustment: InventoryAdjustment;

  @Column({ type: "uuid", nullable: true, default: null })
  productId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  productSnapshot: ProductSnapshot | null;
  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product: Product | null;

  @Column(BaseNumericColumnOptions)
  expectedQuantity: number; // số lượng tồn kho điều chỉnh

  @Column(BaseNumericColumnOptions)
  countedQuantity: number; // số lượng hệ thống đếm được

  @Column(BaseNumericColumnOptions)
  adjustmentQuantity: number; // = countedQuantity - expectedQuantity, có dấu: +tăng, -giảm
  @Column(BaseNumericColumnOptions)
  adjustmentAmount: number; // nếu là tăng: = deltaQuantity * costPriceAtTime, nếu là giảm: tính theo giá bình quân tại thời điểm phát sinh
}
