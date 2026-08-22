import { PartnerSnapshot } from "@/modules/partner";
import {
  BaseNullableNumericColumnOptions,
  BaseNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { OrderLine } from "./OrderLine";
import {
  DiscountTypeEnum,
  OrderStatusEnum,
  OrderTypeEnum,
} from "@/shared/constants/enum";
import { Partner } from "../Partner";
import { BaseEntityWithStore } from "./BaseEntityWithStore";
import { EmployeeSnapshot } from "@/modules/employee/employee.types";
import { Employee } from "./Employee";
import { IncomeExpense } from "./IncomeExpense";

@Entity("orders")
export class Order extends BaseEntityWithStore {
  @Column({ type: "enum", enum: OrderTypeEnum })
  type!: OrderTypeEnum;
  @Column({ type: "varchar", length: 50 })
  code!: string;
  @Column({ type: "uuid", nullable: true, default: null })
  partnerId!: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  partnerSnapshot!: PartnerSnapshot | null;

  @Column({ type: "timestamptz" })
  orderAt!: Date; // ngày thực hiện đơn hàng - nhập kho, xuất kho

  @Column({ type: "uuid", nullable: true, default: null })
  employeeId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  employeeSnapshot!: EmployeeSnapshot | null;

  // TODO ===== Discount (order-level) =====
  @Column({
    type: "enum",
    enum: DiscountTypeEnum,
    default: DiscountTypeEnum.AMOUNT,
  })
  discountType: DiscountTypeEnum; // AMOUNT | PERCENT

  @Column(BaseNullableNumericColumnOptions)
  discountValue: number | null; // % hoặc số tiền, tuỳ discountType

  // TODO ===== Shipping Info =====
  @Column({ type: "uuid", nullable: true, default: null })
  shippingProviderId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  shippingProviderSnapshot: PartnerSnapshot | null;
  @Column(BaseNullableNumericColumnOptions)
  shippingFee: number | null; // phí vận chuyển
  @Column({ type: "boolean", default: true })
  isFreeShipping: boolean; // miễn phí vận chuyển

  // TODO ===== Financial summary =====
  @Column(BaseNumericColumnOptions)
  grossAmount: number;
  @Column(BaseNullableNumericColumnOptions)
  lineDiscountAmount: number | null;
  @Column(BaseNullableNumericColumnOptions)
  orderDiscountAmount: number | null;
  @Column(BaseNumericColumnOptions)
  netAmount: number;
  @Column(BaseNumericColumnOptions)
  taxAmount: number;
  @Column(BaseNumericColumnOptions)
  totalAmount: number;

  // TODO ===== Loyalty Points =====
  // Snapshot hệ số tích điểm tại thời điểm tạo đơn
  @Column({ ...BaseNumericColumnOptions, default: 100000 })
  pointEarnRate!: number; // VNĐ cần để tích 1 điểm (ví dụ: 100000)
  @Column({ ...BaseNumericColumnOptions, default: 1000 })
  pointRedeemRate!: number; // 1 điểm = bao nhiêu VNĐ (ví dụ: 1000)

  // Điểm sử dụng trong đơn này
  @Column(BaseNumericColumnOptions)
  loyaltyPointsUsed!: number; // Điểm khách dùng
  @Column(BaseNumericColumnOptions)
  loyaltyPointsDiscountAmount!: number; // Giá trị giảm từ điểm

  // Điểm tích được từ đơn này (calculated after order)
  @Column(BaseNumericColumnOptions)
  loyaltyPointsEarned!: number; // Điểm tích được

  @Column({
    type: "enum",
    enum: OrderStatusEnum,
    default: OrderStatusEnum.POSTED,
  })
  status?: OrderStatusEnum;

  // For returns, reference to original order
  @Column({ type: "uuid", nullable: true, default: null })
  refOrderId!: string | null; // đơn gốc bị hoàn

  // * ========================= RELATIONS ========================= * //
  @ManyToOne(() => Partner, { onDelete: "SET NULL" })
  @JoinColumn({ name: "partnerId" })
  partner: Partner | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "employeeId" })
  employee: Employee | null;

  @ManyToOne(() => Partner, { onDelete: "SET NULL" })
  @JoinColumn({ name: "shippingProviderId" })
  shippingProvider: Partner | null;

  @ManyToOne(() => Order, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "refOrderId" })
  refOrder?: Order | null;

  @OneToMany(() => IncomeExpense, (incomeExpense) => incomeExpense.order, {
    cascade: true,
  })
  incomeExpenses: IncomeExpense[];

  @OneToMany(() => OrderLine, (line) => line.order, {
    cascade: true,
  })
  lines: OrderLine[];
}
