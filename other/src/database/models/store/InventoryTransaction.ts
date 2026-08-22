import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import {
  InventoryRefTypeEnum,
  InventoryTransactionTypeEnum,
} from "@/shared/constants/enum";
import { Column, Entity } from "typeorm";

@Entity("inventory_transactions")
export class InventoryTransaction extends BaseEntity {
  @Column({ type: "timestamptz" })
  occurredAt!: Date;

  @Column({ type: "uuid" })
  productVariantId!: string;

  @Column({ type: "uuid" })
  storeId!: string;

  @Column(BaseNumericColumnOptions)
  quantity!: number;

  @Column(BaseNumericColumnOptions)
  amount!: number;

  @Column({ type: "enum", enum: InventoryTransactionTypeEnum })
  type!: InventoryTransactionTypeEnum;

  @Column({ type: "enum", enum: InventoryRefTypeEnum })
  refType!: InventoryRefTypeEnum;
  @Column({ type: "uuid" })
  refId!: string;
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  refCode?: string | null;

  // Giữ metadata để tương thích dữ liệu cũ trong giai đoạn chuyển từ FIFO sang bình quân.
  @Column({ type: "jsonb", nullable: true, default: null })
  metadata?: Record<string, any> | null;

  // Running state theo bình quân gia quyền sau mỗi transaction.
  // Trường hợp không có giá lịch sử thì có thể giữ 0.
  @Column({ ...BaseNumericColumnOptions, default: 0 })
  averageCostAfter!: number;

  @Column({ ...BaseNumericColumnOptions, default: 0 })
  quantityAfter!: number;

  // Giá trị tồn kho theo phương pháp bình quân gia quyền sau giao dịch
  @Column({ ...BaseNumericColumnOptions, default: 0 })
  inventoryValueAfter!: number;
}
