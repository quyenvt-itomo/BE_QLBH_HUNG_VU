import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import {
  BaseEntity,
  BaseFactorNumericColumnOptions,
  BaseNullableNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { StockDocument } from "./StockDocument";
import { Product, ProductSnapshot } from "./Product";
import { Attribute, AttributeSnapshot } from "../Attribute";
import { PurchaseLine } from "./PurchaseLine";

@Entity("stock_document_lines")
export class StockDocumentLine extends BaseEntity {
  @Column({ type: "uuid" })
  stockDocumentId: string;

  @Column({ type: "uuid", nullable: true, default: null })
  purchaseLineId: string | null;

  @Column({ type: "uuid", nullable: true, default: null })
  orderLineId: string | null;

  @Column({ type: "uuid", nullable: true, default: null })
  productId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  productSnapshot: ProductSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  unitId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  unitSnapshot: AttributeSnapshot | null;

  @Column(BaseFactorNumericColumnOptions)
  conversionRateAtTime: number; // Tỷ lệ quy đổi tại thời điểm tạo dòng này (dùng để quy đổi sang đơn vị gốc khi cần)

  // Số lượng yêu cầu
  // Chỉ có giá trị với phiếu order_issue
  @Column(BaseNullableNumericColumnOptions)
  requestQuantity: number | null;

  // Số lượng thực tế tính tồn kho, có thể chưa có giá trị do chưa xác nhận xuất/nhập kho
  @Column(BaseNullableNumericColumnOptions)
  stockQuantity: number | null;

  // Số lượng cộng thêm (Số lượng khai báo thêm nếu dòng này có đơn vị tính là DEFAULT_WEIGHT_UNIT)
  // Số lượng này để in phiếu gửi khác hàng,
  // Số lượng thực xuất trên phiếu = stockQuantity + additionalQuantity
  @Column(BaseNullableNumericColumnOptions)
  additionalQuantity: number | null;

  // Số lượng chứng từ
  // Là số lượng NCC báo sẽ giao, hoặc SL khách hàng báo đã nhận được
  @Column(BaseNullableNumericColumnOptions)
  billingQuantity: number | null;

  // Số lượng chênh lệch (tính vào chi phí) (+) là có lợi, (-) là có hại
  // purchase_receipt: stockQuantity - billingQuantity (nếu có)
  // order_issue: billingQuantity - stockQuantity (nếu có)
  @Column(BaseNullableNumericColumnOptions)
  varianceQuantity: number | null;
  // Giá trị chênh lệch (tính vào chi phí) (+) là có lợi, (-) là có hại
  // purchase_receipt: varianceQuantity * purchaseLine.unitPrice
  // order_issue: varianceQuantity * orderLine.unitPrice
  @Column(BaseNullableNumericColumnOptions)
  varianceAmount: number | null;

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => StockDocument, (stockDocument) => stockDocument.lines, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "stockDocumentId" })
  stockDocument: StockDocument;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product: Product | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "unitId" })
  unit: Attribute | null;

  @ManyToOne(() => PurchaseLine, { onDelete: "SET NULL" })
  @JoinColumn({ name: "purchaseLineId" })
  purchaseLine: PurchaseLine | null;

  @ManyToOne(() => PurchaseLine, { onDelete: "SET NULL" })
  @JoinColumn({ name: "orderLineId" })
  orderLine: PurchaseLine | null;
}
