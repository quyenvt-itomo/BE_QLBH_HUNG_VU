import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import {
  BaseEntity,
  BaseNumericColumnOptions,
  BaseQuantityNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { Quotation } from "./Quotation";
import { Product, ProductSnapshot } from "./Product";
import { Attribute, AttributeSnapshot } from "../Attribute";
import { Service, ServiceSnapshot } from "./Service";
import { QuotationCommissionDetail } from "./QuotationCommissionDetail";
import { SaleLineTypeEnum } from "@/shared/constants/enum";

@Entity("quotation_lines")
export class QuotationLine extends BaseEntity {
  @Column({ type: "uuid" })
  quotationId: string;
  @Column({
    type: "varchar",
    length: 20,
    default: SaleLineTypeEnum.PRODUCT,
  })
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

  // TODO: Các thông tin tạm tính
  // Số lượng tạm tính
  // Đây là số lượng tạm tính do người dùng nhập vào
  // Chưa bao gồm số lượng cộng thêm từ người liên hệ
  @Column(BaseQuantityNumericColumnOptions)
  rawQuantity: number;
  // Giá tạm tính
  // Đây là giá tạm tính do người dùng nhập vào, FE tự động fill vào từ giá của hàng hóa hoặc giá bán của dịch vụ
  // Chưa bao gồm giá cộng thêm từ người liên hệ
  @Column(BaseNumericColumnOptions)
  rawUnitPrice: number;
  // Thành tiền tạm tính (rawQuantity * rawUnitPrice)
  @Column(BaseNumericColumnOptions)
  rawSubTotal: number;

  // Số lượng Kg tạm tính (Do NVL mặc định có đvt chính là Kg)
  // FE dựa vào bom để tính ra số lượng Kg cho vật tư chính
  // Nếu là dịch vụ thì số lượng này sẽ bằng số lượng tạm tính
  @Column(BaseQuantityNumericColumnOptions)
  rawMaterialQuantity: number;
  // Giá vốn tạm tính của vật tư chính hoặc của dịch vụ
  @Column(BaseNumericColumnOptions)
  rawMaterialUnitPrice: number;
  // Chi phí tạm tính cộng thêm vào giá vốn của vật tư chính hoặc của dịch vụ
  // Phát sinh do sản xuất, tồn kho, hoặc các yếu tố khác mà người dùng muốn cộng thêm vào giá vốn để tính ra giá bán
  @Column(BaseNumericColumnOptions)
  rawAdditionalCost: number;
  // Thành tiền tổng chi phí của vật tư chính hoặc dịch vụ
  // = rawMaterialQuantity * (rawMaterialUnitPrice + rawAdditionalCost)
  @Column(BaseNumericColumnOptions)
  rawMaterialTotalCost: number;

  // Lợi nhuận tạm tính của dòng này
  // = rawSubTotal - rawMaterialTotalCost
  @Column(BaseNumericColumnOptions)
  rawProfit: number;

  // TODO: Thông tin cho hàng hóa
  // Vật tư chính cấu thành hàng hóa (FE dùng để tự đống tính giá vốn sản xuất và giá bán)
  @Column({ type: "uuid", nullable: true, default: null })
  materialId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  materialSnapshot: ProductSnapshot | null;

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

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => Quotation, (quotation) => quotation.lines, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "quotationId" })
  quotation: Quotation;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product: Product | null;

  @ManyToOne(() => Service, { onDelete: "SET NULL" })
  @JoinColumn({ name: "serviceId" })
  service: Service | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "unitId" })
  unit: Attribute | null;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "materialId" })
  material: Product | null;

  @OneToMany(
    () => QuotationCommissionDetail,
    (detail) => detail.quotationLine,
    { cascade: true },
  )
  commissionDetails: QuotationCommissionDetail[];
}
