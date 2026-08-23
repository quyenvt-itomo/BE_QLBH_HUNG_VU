import { Entity, Column } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { TransactionType } from "@/shared/constants/enum";
import { PartnerSnapshot } from "./Partner";

export enum VatRefType {
  PURCHASE = "purchase", // nhập hàng
  SALE = "sale", // bán hàng
  PURCHASE_RETURN = "purchase_return", // trả hàng NCC
  SALE_RETURN = "sale_return", // khách trả hàng

  EXPENSE = "expense", // chi
  ADJUSTMENT = "adjustment", // điều chỉnh công nợ
}

@Entity("vat_transactions")
export class VatTransaction extends BaseEntity {
  @Column({ type: "timestamptz" })
  occurredAt: Date;

  @Column({ type: "enum", enum: TransactionType })
  type: TransactionType;

  @Column(BaseNumericColumnOptions)
  amount: number;

  @Column({ type: "enum", enum: VatRefType })
  refType: VatRefType;
  @Column({ type: "uuid" })
  refId: string;
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  refCode?: string | null;

  @Column({ type: "jsonb", nullable: true, default: null })
  panrterSnapshot?: PartnerSnapshot | null; // snapshot của đối tác (nếu có)
}
