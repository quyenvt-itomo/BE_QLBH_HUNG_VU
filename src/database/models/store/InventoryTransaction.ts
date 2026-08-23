import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { TransactionType } from "@/shared/constants/enum";
import { Column, Entity } from "typeorm";

export enum InventoryRefType {
  PRODUCT_PRICE_UPDATE = "product_price_update",
  PURCHASE = "purchase",
  SALE = "sale",
  PURCHASE_RETURN = "purchase_return",
  SALE_RETURN = "sale_return",
  TRANSFER = "transfer",
  ADJUST = "adjust",
}

@Entity("inventory_transactions")
export class InventoryTransaction extends BaseEntity {
  @Column({ type: "timestamptz" })
  occurredAt: Date;

  @Column({ type: "uuid" })
  productId: string;

  @Column({ type: "uuid" })
  storeId: string;

  @Column(BaseNumericColumnOptions)
  quantity: number; // với type là product_price_update thì quantity = 0, với các loại khác thì quantity có thể âm hoặc dương

  // với type là product_price_update thì amount = abs(quantityAfter * deltaCostPrice)
  // với các loại khác thì amount = abs(quantity * costPriceAtTime)
  @Column(BaseNumericColumnOptions)
  amount: number;

  @Column({ type: "enum", enum: TransactionType })
  type: TransactionType;

  // Trường hợp không có giá lịch sử thì có thể giữ 0.
  @Column(BaseNumericColumnOptions)
  costPriceAfter: number;

  @Column(BaseNumericColumnOptions)
  quantityAfter: number;

  @Column(BaseNumericColumnOptions)
  inventoryValueAfter: number; // = costPriceAfter * quantityAfter

  @Column({ type: "enum", enum: InventoryRefType })
  refType: InventoryRefType;
  @Column({ type: "uuid" })
  refId: string;
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  refCode?: string | null;
}
