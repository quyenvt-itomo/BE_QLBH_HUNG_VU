import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { PartnerDebtOffset } from "./PartnerDebtOffset";
import { Invoice, InvoiceSnapshot, InvoiceType } from "./Invoice";

export enum PartnerDebtOffsetSideEnum {
  PAYABLE = "payable",
  RECEIVABLE = "receivable",
}

/**
 * Dòng đối trừ theo từng hóa đơn.
 * Một phiếu đối trừ có 2 danh sách: hóa đơn đầu vào (payable) và hóa đơn đầu ra (receivable).
 * Tổng giá trị giảm trừ 2 bên phải bằng nhau (= offsetAmount của phiếu).
 */
@Entity("debt_offset_lines")
export class PartnerDebtOffsetLine extends BaseEntity {
  @Column({ type: "uuid" })
  offsetId: string;

  @Column({ type: "enum", enum: PartnerDebtOffsetSideEnum })
  side: PartnerDebtOffsetSideEnum;

  @Column({ type: "uuid" })
  invoiceId: string;
  @Column({ type: "jsonb", nullable: true, default: null })
  invoiceSnapshot: InvoiceSnapshot | null;

  @Column(BaseNumericColumnOptions)
  amount: number;

  @Column({ type: "varchar", length: 20, nullable: true, default: null })
  invoiceCode: string | null;

  @Column({ type: "varchar", length: 20, nullable: true, default: null })
  invoiceType: InvoiceType | null;

  // * ======================== RELATIONS ========================= //
  @ManyToOne(() => PartnerDebtOffset, (offset) => offset.lines, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "offsetId" })
  offset: PartnerDebtOffset;

  @ManyToOne(() => Invoice, { onDelete: "SET NULL" })
  @JoinColumn({ name: "invoiceId" })
  invoice: Invoice | null;
}
