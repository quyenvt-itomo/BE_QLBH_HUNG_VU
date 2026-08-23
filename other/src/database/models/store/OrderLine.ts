import { ProductVariantSnapshot } from "@/modules/product";
import {
  BaseEntity,
  BaseNullableNumericColumnOptions,
  BaseNumericColumnOptions,
  BaseSortOrderColumnOptions,
} from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Order } from "./Order";
import { DiscountTypeEnum, OrderLineTypeEnum } from "@/shared/constants/enum";
import { ProductVariant } from "../ProductVariant";

@Entity("order_lines")
export class OrderLine extends BaseEntity {
  @Column({ type: "uuid" })
  orderId: string;

  @Column({
    type: "enum",
    enum: OrderLineTypeEnum,
    default: OrderLineTypeEnum.NORMAL,
  })
  lineType: OrderLineTypeEnum; // NORMAL | RETURN

  @Column({ type: "uuid", nullable: true, default: null })
  productVariantId: string | null;
  @Column({ type: "jsonb" })
  productVariantSnapshot: ProductVariantSnapshot;

  // TODO: Trước giảm giá
  @Column(BaseNumericColumnOptions)
  unitPrice: number;
  @Column(BaseNumericColumnOptions)
  quantity: number;
  @Column(BaseNumericColumnOptions)
  subTotal: number;

  // TODO: Giảm giá trên dòng
  @Column(BaseNullableNumericColumnOptions)
  discountValue: number | null; // giá trị giảm (số tiền | % tuỳ discountType)
  @Column({ type: "enum", enum: DiscountTypeEnum })
  discountType: DiscountTypeEnum; // AMOUNT | PERCENT
  @Column(BaseNullableNumericColumnOptions)
  discountAmount: number | null; // giá trị giảm của dòng (đã quy ra tiền do BE tính)

  // TODO: Giảm giá của hợp đồng phân bổ xuống dòng (calculate on BE)
  @Column(BaseNullableNumericColumnOptions)
  orderDiscountAmount: number | null; // giá trị giảm của hợp đồng được phân bổ xuống dòng (đã quy ra tiền, BE tính)

  // TODO: Sau giảm giá và tính phụ phí
  @Column(BaseNumericColumnOptions)
  netAmount: number; // thành tiền sau giảm giá (amount - discountAmount - contractDiscountAmount + contractExtraFeeAmount, BE tính)

  // TODO: Thuế
  @Column(BaseNullableNumericColumnOptions)
  taxRate: number | null; // 0, 8, 10
  @Column(BaseNumericColumnOptions)
  taxAmount: number; // tiền thuế (calculate on price - discountAmount, BE tính)

  // TODO: Thành tiền cuối dòng
  @Column(BaseNumericColumnOptions)
  totalAmount: number; // thành tiền cuối dòng (after discount + tax, BE tính)

  @Column(BaseSortOrderColumnOptions)
  sortOrder: number;

  // For returns, reference to original line
  @Column({ type: "uuid", nullable: true, default: null })
  refOrderLineId: string | null; // dòng gốc bị hoàn

  // * ========================= RELATIONS ========================= * //
  @ManyToOne(() => Order, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId" })
  order: Order;

  @ManyToOne(() => ProductVariant, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productVariantId" })
  productVariant: ProductVariant | null;

  @ManyToOne(() => OrderLine, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "refOrderLineId" })
  refOrderLine?: OrderLine | null;
}
