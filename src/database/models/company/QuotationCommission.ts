import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Quotation } from "./Quotation";
import { PartnerContact, PartnerContactSnapshot } from "./PartnerContact";
import { QuotationCommissionDetail } from "./QuotationCommissionDetail";

@Entity("quotation_commissions")
export class QuotationCommission extends BaseEntity {
  @Column({ type: "uuid" })
  quotationId: string;

  // Người hưởng (là người liên hệ bên phía đối tác)
  @Column({ type: "uuid", nullable: true, default: null })
  partnerContactId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  partnerContactSnapshot: PartnerContactSnapshot | null;

  @Column(BaseNumericColumnOptions)
  totalAmount: number;

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => Quotation, (quotation) => quotation.commissions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "quotationId" })
  quotation: Quotation;

  @ManyToOne(() => PartnerContact, { onDelete: "SET NULL" })
  @JoinColumn({ name: "partnerContactId" })
  partnerContact: PartnerContact | null;

  @OneToMany(
    () => QuotationCommissionDetail,
    (detail) => detail.quotationCommission,
    { cascade: true },
  )
  details: QuotationCommissionDetail[];
}
