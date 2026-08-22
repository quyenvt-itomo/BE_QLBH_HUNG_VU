import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import {
  BaseEntity,
  BaseFactorNumericColumnOptions,
  BaseNumericColumnOptions,
  BaseQuantityNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { Purchase } from "./Purchase";
import { Product, ProductSnapshot } from "./Product";
import { Attribute, AttributeSnapshot } from "../Attribute";

@Entity("purchase_lines")
export class PurchaseLine extends BaseEntity {
  @Column({ type: "uuid" })
  purchaseId: string;

  @Column({ type: "uuid", nullable: true, default: null })
  productId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  productSnapshot: ProductSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  unitId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  unitSnapshot: AttributeSnapshot | null;

  /** Hệ số quy đổi tại thời điểm tạo phiếu, không được lấy lại từ Product. */
  @Column(BaseFactorNumericColumnOptions)
  conversionRateAtTime: number;

  @Column(BaseQuantityNumericColumnOptions)
  quantity: number;

  @Column(BaseNumericColumnOptions)
  unitPrice: number;

  @Column(BaseNumericColumnOptions)
  taxRate: number;

  @Column(BaseNumericColumnOptions)
  subTotal: number; // Tổng tiền trước thuế và chiết khấu

  @Column(BaseNumericColumnOptions)
  taxAmount: number; // Số tiền thuế của dòng này (subTotal * taxRate)

  @Column(BaseNumericColumnOptions)
  grossAmount: number; // Số tiền sau thuế (subTotal + taxAmount)

  // Hoa hồng cho người bán hàng (tính theo % trên subTotal)
  @Column(BaseNumericColumnOptions)
  commissionRate: number;
  @Column(BaseNumericColumnOptions)
  commissionAmount: number; // Số tiền hoa hồng (subTotal * commissionRate)

  // Kết quả giao
  // deliveredQuantity = sum(stockDocumentLines.billingQuantity)
  // deliveryRate = abs(quantity - deliveredQuantity) / quantity * 100 không vượt quá tolerancePercent
  @Column(BaseQuantityNumericColumnOptions)
  deliveredQuantity: number;

  // Hoa hồng thực tế khi đơn hàng hoàn thành = deliveredQuantity
  @Column(BaseNumericColumnOptions)
  actualCommissionAmount: number;

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => Purchase, (purchase) => purchase.lines, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "purchaseId" })
  purchase: Purchase;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product: Product | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "unitId" })
  unit: Attribute | null;
}
