import { Entity, Column } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { DebtSide, TransactionType } from "@/shared/constants/enum";

export enum DebtRefTypeEnum {
  PURCHASE = "purchase", // nhập hàng
  SALE = "sale", // bán hàng
  PURCHASE_RETURN = "purchase_return", // trả hàng NCC
  SALE_RETURN = "sale_return", // khách trả hàng

  INCOME = "income", // thu
  EXPENSE = "expense", // chi
  DEBT_OFFSET = "debt_offset", // đối trừ công nợ
  ADJUSTMENT = "adjustment", // điều chỉnh công nợ

  SHIPPING_FEE = "shipping_fee", // phí vận chuyển
}

@Entity("debt_transactions")
export class PartnerDebtTransaction extends BaseEntity {
  @Column({ type: "timestamptz" })
  occurredAt: Date;

  @Column({ type: "uuid" })
  partnerId: string;

  @Column({ type: "enum", enum: DebtSide })
  side: DebtSide;

  @Column({ type: "enum", enum: TransactionType })
  type: TransactionType;

  @Column(BaseNumericColumnOptions)
  amount: number;

  @Column({ type: "enum", enum: DebtRefTypeEnum })
  refType: DebtRefTypeEnum;
  @Column({ type: "uuid" })
  refId: string;
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  refCode?: string | null;
}
