import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { TransactionTypeEnum } from "@/shared/constants/enum";
import { Column, Entity, Index } from "typeorm";

export enum InventoryTransactionRefType {
  PURCHASE_RECEIPT = "purchase_receipt", // Phiếu nhập kho từ đơn mua hàng
  MATERIAL_ISSUE = "material_issue", // Phiếu xuất kho bán hàng
  PRODUCTION_RECEIPT = "production_receipt", // Phiếu nhập kho từ sản xuất
  ORDER_ISSUE = "order_issue", // Phiếu xuất kho từ đơn bán hàng
  TRANSFER = "transfer",
  ADJUST = "adjust",
}

// Nhập trước xuất trước
export interface FifoData {
  quantity: number;
  unitPrice: number;
  occurredAt: Date;
  refId: string;
  refCode?: string | null;
  refType: InventoryTransactionRefType;
}

@Entity("inventory_transactions")
@Index(["companyId", "occurredAt"])
@Index(["productId", "warehouseId", "occurredAt"])
@Index(["refType", "refId"])
export class InventoryTransaction extends BaseEntity {
  @Column({ type: "uuid" })
  @Index()
  companyId: string;

  @Column({ type: "timestamptz" })
  occurredAt: Date;

  @Column({ type: "uuid" })
  productId: string;

  @Column({ type: "uuid" })
  warehouseId: string;

  @Column(BaseNumericColumnOptions)
  quantity: number;

  @Column(BaseNumericColumnOptions)
  amount: number;

  @Column({ type: "enum", enum: TransactionTypeEnum })
  type: TransactionTypeEnum;

  @Column({ type: "varchar", length: 20 })
  refType: InventoryTransactionRefType;

  @Column({ type: "uuid" })
  refId: string;

  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  refCode?: string | null;

  // Running state theo FIFO sau mỗi transaction.
  // Tổng số lượng tồn kho sau giao dịch này (tổng quantity của fifoDataAfter).
  @Column({ ...BaseNumericColumnOptions, default: 0 })
  quantityAfter: number;

  // Tổng giá trị tồn kho theo FIFO sau giao dịch này (tổng quantity * unitPrice của fifoDataAfter).
  @Column({ ...BaseNumericColumnOptions, default: 0 })
  inventoryValueAfter: number;

  // Dữ liệu FIFO
  @Column({ type: "jsonb" })
  fifoDataAfter: FifoData[];
}
