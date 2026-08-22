import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { QuotationLine } from "./QuotationLine";
import { QuotationCommission } from "./QuotationCommission";

// Hoa hồng có thể gửi giá hoặc gửi lượng, giá hay lượng sẽ có VAT đi kèm

@Entity("quotation_commission_details")
export class QuotationCommissionDetail extends BaseEntity {
  @Column({ type: "uuid" })
  quotationCommissionId: string;

  @Column({ type: "uuid" })
  quotationLineId: string;

  // Gửi giá
  @Column(BaseNumericColumnOptions)
  price: number;
  @Column(BaseNumericColumnOptions)
  priceAmount: number; // = price * quotationLine.quantity
  @Column(BaseNumericColumnOptions)
  priceTaxRate: number;
  @Column(BaseNumericColumnOptions)
  priceTaxRateAmount: number; // = (quotationLine.taxRate - priceTaxRate) * priceAmount

  // Gửi lượng
  @Column(BaseNumericColumnOptions)
  quantity: number;
  @Column(BaseNumericColumnOptions)
  quantityAmount: number; // = quantity * quotationLine.rawUnitPrice
  @Column(BaseNumericColumnOptions)
  quantityTaxRate: number;
  @Column(BaseNumericColumnOptions)
  quantityTaxRateAmount: number; // = (quotationLine.taxRate - quantityTaxRate) * quantityAmount

  // Tổng hoa hồng cho người liên hệ này trên dòng này = priceAmount + priceTaxRateAmount + quantityAmount + quantityTaxRateAmount
  @Column(BaseNumericColumnOptions)
  totalAmount: number; // = priceAmount + priceTaxRateAmount + quantityAmount + quantityTaxRateAmount

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => QuotationCommission, (qc) => qc.details, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "quotationCommissionId" })
  quotationCommission: QuotationCommission | null;

  @ManyToOne(() => QuotationLine, (ql) => ql.commissionDetails, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "quotationLineId" })
  quotationLine: QuotationLine;
}
