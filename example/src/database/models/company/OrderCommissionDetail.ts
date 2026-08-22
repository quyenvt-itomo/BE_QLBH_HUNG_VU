import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { OrderLine } from "./OrderLine";
import { OrderCommission } from "./OrderCommission";

// Hoa hồng có thể gửi giá hoặc gửi lượng, giá hay lượng sẽ có VAT đi kèm

@Entity("order_commission_details")
export class OrderCommissionDetail extends BaseEntity {
  @Column({ type: "uuid" })
  orderCommissionId: string;

  @Column({ type: "uuid" })
  orderLineId: string;

  // Tổng hoa hồng cho người liên hệ này trên dòng này = priceAmount + priceTaxRateAmount + quantityAmount + quantityTaxRateAmount
  @Column(BaseNumericColumnOptions)
  totalAmount: number; // = priceAmount + priceTaxRateAmount + quantityAmount + quantityTaxRateAmount

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => OrderCommission, (qc) => qc.details, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "orderCommissionId" })
  orderCommission: OrderCommission | null;

  @ManyToOne(() => OrderLine, (ql) => ql.commissionDetails, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "orderLineId" })
  orderLine: OrderLine;
}
