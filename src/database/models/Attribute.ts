import { BaseEntity } from "@/shared/base/BaseEntity";
import { Column, Entity, Index, ManyToOne, JoinColumn } from "typeorm";
import { Organization } from "./Organization";

export enum AttributeType {
  OPERATION = "operation", // công đoạn sản xuất
  UNIT = "unit", // đơn vị tính
  JOB_TITLE = "job_title", // chuc vu

  INCOME_CATEGORY = "income_category", // loại thu
  EXPENSE_CATEGORY = "expense_category", // loại chi

  // Nhóm hàng hóa
  FINISHED_GROUP = "finished_group", // nhóm thành phẩm
  MAIN_MATERIAL_GROUP = "main_material_group", // nhóm nguyên vật liệu
  SUB_MATERIAL_GROUP = "sub_material_group", // nhóm nguyên vật liệu phụ
  TOOLS_GROUP = "tools_group", // nhóm công cụ dụng cụ

  PARTNER_GROUP = "partner_group",
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
  companyId: string | null;

  @ManyToOne(() => Organization, { onDelete: "SET NULL" })
  @JoinColumn({ name: "companyId" })
  company: Organization | null;
}
