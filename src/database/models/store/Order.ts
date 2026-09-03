import {
  BaseNullableNumericColumnOptions,
  BaseNumericColumnOptions,
  UserSnapshot,
} from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { OrderLine } from "./OrderLine";
import { RateType } from "@/shared/constants/enum";
import { Partner, PartnerSnapshot } from "../Partner";
import { IncomeExpense } from "./IncomeExpense";
import { StoreEntity } from "./StoreEntity";
import { User } from "../User";

export enum OrderType {
  PURCHASE = "purchase",
  SALE = "sale",

  PURCHASE_RETURN = "purchase_return", // trả NCC
  SALE_RETURN = "sale_return", // khách trả
}
export const ReturnOrderTypes = [
  OrderType.PURCHASE_RETURN,
  OrderType.SALE_RETURN,
];

export enum OrderStatus {
  DRAFT = "draft", // Vừa tạo, chưa hoàn thành
  COMPLETED = "completed", // Đã hoàn thành nhập/xuất kho
  CANCELED = "canceled", // Đã hủy
}

export interface OrderSnapshot {
  id: string;
  type: OrderType;

  code: string;
  orderAt: Date;

  partnerId: string | null;
  partnerSnapshot: PartnerSnapshot | null;
}

@Entity("orders")
export class Order extends StoreEntity {
  @Column({ type: "enum", enum: OrderType })
  type: OrderType;
  @Column({ type: "enum", enum: OrderStatus, default: OrderStatus.DRAFT })
  status: OrderStatus;

  @Column({ type: "varchar", length: 50 })
  code: string;
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  orderAt: Date; // ngày thực hiện đơn hàng
  @Column({ type: "timestamptz", nullable: true, default: null })
  occurredAt: Date | null; // ngày thực hiện nhập/xuất kho, có thể khác orderAt
  @Column({ type: "timestamptz", nullable: true })
  canceledAt: Date | null; // ngày hủy đơn hàng, chỉ có khi status = CANCELED

  @Column({ type: "uuid", nullable: true, default: null })
  partnerId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  partnerSnapshot: PartnerSnapshot | null;
  @ManyToOne(() => Partner, { onDelete: "SET NULL" })
  @JoinColumn({ name: "partnerId" })
  partner: Partner | null;

  // TODO ===== Người hoàn thành đơn hàng (có thể khác creator) =====
  @Column({ type: "uuid", nullable: true, default: null })
  completerId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  completerSnapshot: UserSnapshot | null;
  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "completerId" })
  completer: User | null;

  // TODO ===== Người hủy đơn hàng (có thể khác creator) =====
  @Column({ type: "uuid", nullable: true, default: null })
  cancelerId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  cancelerSnapshot: UserSnapshot | null;
  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "cancelerId" })
  canceler: User | null;

  // TODO ===== Discount (order-level) =====
  @Column({ type: "enum", enum: RateType, default: RateType.AMOUNT })
  discountType: RateType;
  @Column(BaseNullableNumericColumnOptions)
  discountValue: number | null;

  // TODO ===== Tax =====
  @Column({ type: "enum", enum: RateType, default: RateType.AMOUNT })
  taxType: RateType;
  @Column(BaseNullableNumericColumnOptions)
  taxValue: number | null;

  // TODO ===== Shipping Info =====
  @Column({ type: "uuid", nullable: true, default: null })
  shipperId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  shipperSnapshot: PartnerSnapshot | null;
  @ManyToOne(() => Partner, { onDelete: "SET NULL" })
  @JoinColumn({ name: "shipperId" })
  shipper: Partner | null;

  @Column(BaseNullableNumericColumnOptions)
  shippingFee: number | null; // phí vận chuyển
  @Column({ type: "boolean", default: true })
  isFreeShipping: boolean; // mua: DN tự thanh toán; bán: miễn phí cho khách

  // TODO ===== Financial summary =====
  @Column(BaseNumericColumnOptions)
  grossAmount: number;
  @Column(BaseNullableNumericColumnOptions)
  discountAmount: number | null;
  @Column(BaseNumericColumnOptions)
  netAmount: number;
  @Column(BaseNumericColumnOptions)
  taxAmount: number;
  @Column(BaseNumericColumnOptions)
  totalAmount: number;

  @Column(BaseNumericColumnOptions)
  totalCost: number;

  // TODO ===== Return Order =====
  @Column({ type: "uuid", nullable: true, default: null })
  refOrderId: string | null;
  @ManyToOne(() => Order, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "refOrderId" })
  refOrder?: Order | null; // đơn hàng gốc bị trả

  @Column({ type: "enum", enum: RateType, default: RateType.AMOUNT })
  returnDiscountType: RateType;
  @Column(BaseNullableNumericColumnOptions)
  returnDiscountValue: number | null;

  @Column({ type: "enum", enum: RateType, default: RateType.AMOUNT })
  returnTaxType: RateType;
  @Column(BaseNullableNumericColumnOptions)
  returnTaxValue: number | null;

  @Column(BaseNumericColumnOptions)
  returnGrossAmount: number;
  @Column(BaseNullableNumericColumnOptions)
  returnDiscountAmount: number | null;
  @Column(BaseNumericColumnOptions)
  returnNetAmount: number;
  @Column(BaseNumericColumnOptions)
  returnTaxAmount: number;
  @Column(BaseNumericColumnOptions)
  returnTotalAmount: number;

  @Column(BaseNumericColumnOptions)
  returnTotalCost: number;

  // TODO: Giá trị thực tế cần thanh toán (có thể âm hoặc dương)
  @Column(BaseNumericColumnOptions)
  settlementAmount: number; // = totalAmount - returnTotalAmount

  @OneToMany(() => IncomeExpense, (ie) => ie.order, { cascade: true })
  incomeExpenses: IncomeExpense[];

  @OneToMany(() => OrderLine, (line) => line.order, { cascade: true })
  lines: OrderLine[];

  @OneToMany(() => OrderLine, (line) => line.returnOrder, { cascade: true })
  returnLines: OrderLine[];
}
