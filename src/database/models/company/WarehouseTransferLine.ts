import {
  BaseEntity,
  BaseFactorNumericColumnOptions,
  BaseNumericColumnOptions,
  BaseSortOrderColumnOptions,
} from "@/shared/base/BaseEntity";
import { Column, Entity, ManyToOne, JoinColumn } from "typeorm";
import { WarehouseTransfer } from "./WarehouseTransfer";
import { Attribute, AttributeSnapshot } from "../Attribute";
import { Product, ProductSnapshot } from "./Product";

@Entity("warehouse_transfer_lines")
export class WarehouseTransferLine extends BaseEntity {
  @Column({ type: "uuid" })
  transferId: string;

  @Column({ type: "uuid", nullable: true, default: null })
  productId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  productSnapshot: ProductSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  unitId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  unitSnapshot: AttributeSnapshot | null;

  @Column(BaseFactorNumericColumnOptions)
  conversionRateAtTime: number;

  // Số lượng yêu cầu chuyển
  @Column(BaseNumericColumnOptions)
  requestQuantity: number;

  // Số lượng thực tế đã chuyển (được cập nhật bởi thao tác xuất kho, dùng để tính transaction-out)
  @Column(BaseNumericColumnOptions)
  actualQuantity: number;

  // Số lượng thực nhận (được cập nhật bởi thao tác nhập kho, dùng để tính transaction-in)
  @Column(BaseNumericColumnOptions)
  receivedQuantity: number;

  @Column(BaseSortOrderColumnOptions)
  sortOrder: number;

  // * ========================= RELATIONS ========================= * //
  @ManyToOne(() => WarehouseTransfer, (transfer) => transfer.lines, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "transferId" })
  transfer: WarehouseTransfer;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product: Product | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "unitId" })
  unit: Attribute | null;
}
