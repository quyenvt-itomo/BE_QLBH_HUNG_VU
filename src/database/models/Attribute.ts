import { BaseEntity } from "@/shared/base/BaseEntity";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Store } from "./Store";

export enum AttributeType {
  // TODO: Hàng hóa
  UNIT = "unit", // đơn vị tính
  PRODUCT_GROUP = "product_group", // nhóm hàng hóa
  BRAND = "brand", // thương hiệu
  LOCATION = "location", // vị trí kho/kệ

  // TODO: Hạng mục thu chi
  INCOME_CATEGORY = "income_category", // loại thu
  EXPENSE_CATEGORY = "expense_category", // loại chi

  // TODO: Đối tác
  CUSTOMER_GROUP = "customer_group", // nhóm khách hàng
  SUPPLIER_GROUP = "supplier_group", // nhóm nhà cung cấp
  SHIPPER_GROUP = "shipper_group", // nhóm đơn vị vận chuyển
}

/** Attribute types whose records belong to one store instead of being global. */
export const STORE_SCOPED_ATTRIBUTE_TYPES: readonly AttributeType[] = [
  AttributeType.LOCATION,
];

export const isStoreScopedAttributeType = (
  type?: AttributeType | null,
): boolean => (type ? STORE_SCOPED_ATTRIBUTE_TYPES.includes(type) : false);

/** Names of system income/expense categories used by transaction modules. */
export const ATTRIBUTE_NAMES = {
  INCOME_CUSTOMER: "Thu tiền khách hàng",
  INCOME_SUPPLIER: "NCC hoàn tiền",
  EXPENSE_SUPPLIER: "Trả tiền NCC",
  EXPENSE_CUSTOMER: "Hoàn tiền khách hàng",
  EXPENSE_VAT: "Nộp thuế VAT",
} as const;

export type AttributeName = (typeof ATTRIBUTE_NAMES)[keyof typeof ATTRIBUTE_NAMES];

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
  @ManyToOne(() => Attribute, (attr) => attr.children, { onDelete: "CASCADE" })
  @JoinColumn({ name: "parentId" })
  parent?: Attribute;

  @OneToMany(() => Attribute, (attr) => attr.parent)
  children?: Attribute[];

  @Index()
  @Column({ type: "uuid", nullable: true, default: null })
  storeId?: string | null;
  @ManyToOne(() => Store, { onDelete: "CASCADE" })
  @JoinColumn({ name: "storeId" })
  store?: Store | null;

  /** Computed statistics populated by AttributeRepository list queries. */
  productCount?: number;
  partnerCount?: number;
  incomeExpenseCount?: number;
  incomeExpenseAmount?: number;
}
