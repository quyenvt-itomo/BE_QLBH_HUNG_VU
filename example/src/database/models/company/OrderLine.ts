import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import {
  BaseEntity,
  BaseNumericColumnOptions,
  BaseQuantityNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { Order } from "./Order";
import { Product, ProductSnapshot } from "./Product";
import { Attribute, AttributeSnapshot } from "../Attribute";
import { Service, ServiceSnapshot } from "./Service";
import { OrderCommissionDetail } from "./OrderCommissionDetail";
import { SaleLineTypeEnum } from "@/shared/constants/enum";
import { QuotationLine } from "./QuotationLine";

@Entity("order_lines")
export class OrderLine extends BaseEntity {
  @Column({ type: "uuid" })
  orderId: string;
  @Column({ type: "uuid", nullable: true, default: null })
  quotationLineId: string | null;

  @Column({ type: "varchar", length: 20, default: SaleLineTypeEnum.PRODUCT })
  type: SaleLineTypeEnum;

  @Column({ type: "uuid", nullable: true, default: null })
  productId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  productSnapshot: ProductSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  serviceId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  serviceSnapshot: ServiceSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  unitId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  unitSnapshot: AttributeSnapshot | null;

  // Số lượng thực tế = số lượng tạm tính + tổng số lượng cộng thêm từ người liên hệ
  @Column(BaseQuantityNumericColumnOptions)
  quantity: number;

  // Giá thực tế = giá tạm tính + giá cộng thêm từ người liên hệ
  @Column(BaseNumericColumnOptions)
  unitPrice: number;

  @Column(BaseNumericColumnOptions)
  taxRate: number;

  @Column(BaseNumericColumnOptions)
  subTotal: number; // Tổng tiền trước thuế và chiết khấu = quantity * unitPrice

  @Column(BaseNumericColumnOptions)
  taxAmount: number; // Số tiền thuế của dòng này (subTotal * taxRate)

  @Column(BaseNumericColumnOptions)
  grossAmount: number; // Số tiền sau thuế (subTotal + taxAmount)

  // Số tiền hoa hồng
  // = tổng số tiền hoa hồng của tất cả người liên hệ đối với dòng này
  @Column(BaseNumericColumnOptions)
  commissionAmount: number;

  // Kết quả giao
  // deliveredQuantity = sum(stockDocumentLines.billingQuantity)
  // deliveryRate = abs(quantity - deliveredQuantity) / quantity * 100 không vượt quá tolerancePercent
  @Column(BaseQuantityNumericColumnOptions)
  deliveredQuantity: number;

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => Order, (order) => order.lines, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId" })
  order: Order;

  @ManyToOne(() => QuotationLine, { onDelete: "SET NULL" })
  @JoinColumn({ name: "quotationLineId" })
  quotationLine: QuotationLine | null;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product: Product | null;

  @ManyToOne(() => Service, { onDelete: "SET NULL" })
  @JoinColumn({ name: "serviceId" })
  service: Service | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "unitId" })
  unit: Attribute | null;

  @OneToMany(() => OrderCommissionDetail, (detail) => detail.orderLine, {
    cascade: true,
  })
  commissionDetails: OrderCommissionDetail[];
}
