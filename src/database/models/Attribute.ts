import { BaseEntity } from "@/shared/base/BaseEntity";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";

export enum AttributeType {
  UNIT = "unit", // đơn vị tính

  INCOME_CATEGORY = "income_category", // loại thu
  EXPENSE_CATEGORY = "expense_category", // loại chi

  // Nhóm hàng hóa
  PRODUCT_GROUP = "product_group", // nhóm hàng hóa

  CUSTOMER_GROUP = "customer_group", // nhóm khách hàng
  SUPPLIER_GROUP = "supplier_group", // nhóm nhà cung cấp
  SHIPPER_GROUP = "shipper_group", // nhóm đơn vị vận chuyển
}

export const DEFAULT_WEIGHT_UNIT = "Kg";
export const DEFAULT_MESH_UNIT = "Tấm";
export const DEFAULT_AREA_UNIT = "m²";

export const INCOME_CUSTOMER = "Thu công nợ khách hàng";
export const INCOME_DEPOSIT = "Thu lãi khoản gửi";
export const INCOME_WITHDRAW = "Rút tiền khoản gửi";
export const INCOME_CAPITAL_CONTRIBUTION = "Góp vốn";

export const EXPENSE_PAYMENT_REQUEST = "Thanh toán theo đề nghị";
export const EXPENSE_LOAN = "Thanh toán dư nợ khoản vay";
export const EXPENSE_INTEREST = "Thanh toán lãi vay";
export const EXPENSE_VAT = "Nộp thuế VAT";
export const EXPENSE_CAPITAL_WITHDRAWAL = "Rút vốn";
export const EXPENSE_PROFIT_DISTRIBUTION = "Phân phối lợi nhuận";

export interface AttributeSnapshot {
  id: string;
  name: string;
}

@Entity("attributes")
export class Attribute extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Index()
  @Column({ type: "varchar", length: 20 })
  type: AttributeType;

  @Index()
  @Column({ type: "uuid", nullable: true })
  parentId?: string | null;

  @ManyToOne(() => Attribute, (attr) => attr.children, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "parentId" })
  parent?: Attribute;

  @OneToMany(() => Attribute, (attr) => attr.parent)
  children?: Attribute[];
}
