import { ExportColumnConfig } from "../excel.types";
import { PartnerType } from "@/database/models/Partner";
import { DebtSide } from "@/shared/constants/enum";

export interface PartnerExcelConfig {
  entityType: "customer" | "supplier";
  partnerType: PartnerType.CUSTOMER | PartnerType.SUPPLIER;
  mainSheetName: string;
  columns: ExportColumnConfig[];
  contactColumns: ExportColumnConfig[];
  bankColumns: ExportColumnConfig[];
  debtSide: DebtSide;
}

export const PARTNER_SHEET_NAMES = {
  MAIN: "Đối tác",
  CONTACTS: "Người liên hệ",
  BANKS: "Ngân hàng",
  GUIDE: "Hướng dẫn",
} as const;

export const CUSTOMER_COLUMNS: ExportColumnConfig[] = [
  { field: "name", header: "Tên khách hàng (*)", width: 32, required: true },
  { field: "code", header: "Mã khách hàng", width: 20 },
  { field: "identityCode", header: "CMND/CCCD", width: 22 },
  { field: "taxCode", header: "Mã số thuế", width: 20 },
  { field: "phone", header: "Số điện thoại", width: 20 },
  { field: "email", header: "Email", width: 30 },
  { field: "gender", header: "Giới tính", width: 14, options: ["Nam", "Nữ", "Khác"] },
  { field: "dob", header: "Ngày sinh", width: 16, type: "date" },
  { field: "maxDebtAmount", header: "Hạn mức công nợ", width: 20, type: "number", numberFormat: "#,##0.00" },
  { field: "currentDebtAmount", header: "Nợ phải thu hiện tại", width: 22, type: "number", numberFormat: "#,##0.00" },
  { field: "isOrganization", header: "Phân loại đơn vị", width: 20, options: ["Cá nhân", "Tổ chức"] },
  { field: "address", header: "Địa chỉ", width: 45 },
  { field: "groupName", header: "Nhóm khách hàng", width: 24 },
  { field: "note", header: "Ghi chú", width: 35 },
  { field: "representativeName", header: "Tên người đại diện", width: 26 },
  { field: "representativeIdentityCode", header: "CCCD/CMND người đại diện", width: 26 },
  { field: "representativePhone", header: "SĐT người đại diện", width: 20 },
  { field: "representativeEmail", header: "Email người đại diện", width: 28 },
];

export const SUPPLIER_COLUMNS: ExportColumnConfig[] = [
  { field: "name", header: "Tên nhà cung cấp (*)", width: 32, required: true },
  { field: "code", header: "Mã nhà cung cấp", width: 20 },
  { field: "identityCode", header: "CMND/CCCD", width: 22 },
  { field: "taxCode", header: "Mã số thuế", width: 20 },
  { field: "phone", header: "Số điện thoại", width: 20 },
  { field: "email", header: "Email", width: 30 },
  { field: "maxDebtAmount", header: "Hạn mức công nợ", width: 20, type: "number", numberFormat: "#,##0.00" },
  { field: "currentDebtAmount", header: "Nợ phải trả hiện tại", width: 22, type: "number", numberFormat: "#,##0.00" },
  { field: "isOrganization", header: "Phân loại đơn vị", width: 20, options: ["Cá nhân", "Tổ chức"] },
  { field: "address", header: "Địa chỉ", width: 45 },
  { field: "groupName", header: "Nhóm nhà cung cấp", width: 24 },
  { field: "note", header: "Ghi chú", width: 35 },
  { field: "representativeName", header: "Tên người đại diện", width: 26 },
  { field: "representativeIdentityCode", header: "CCCD/CMND người đại diện", width: 26 },
  { field: "representativePhone", header: "SĐT người đại diện", width: 20 },
  { field: "representativeEmail", header: "Email người đại diện", width: 28 },
];

/** Legacy alias used by shared partner helpers. New Excel flows use the type-specific configs. */
export const PARTNER_COLUMNS = CUSTOMER_COLUMNS;

const createContactColumns = (partnerCodeHeader: string): ExportColumnConfig[] => [
  { field: "partnerCode", header: partnerCodeHeader, width: 20, required: true },
  { field: "name", header: "Tên người liên hệ (*)", width: 28, required: true },
  { field: "phone", header: "Số điện thoại", width: 20 },
  { field: "email", header: "Email", width: 28 },
  { field: "identityCode", header: "CCCD/CMND", width: 22 },
  { field: "bankName", header: "Ngân hàng", width: 24 },
  { field: "accountNumber", header: "Số tài khoản", width: 24 },
  { field: "accountHolder", header: "Chủ tài khoản", width: 28 },
  { field: "branch", header: "Chi nhánh", width: 24 },
];

const createBankColumns = (partnerCodeHeader: string): ExportColumnConfig[] => [
  { field: "partnerCode", header: partnerCodeHeader, width: 20, required: true },
  { field: "bankName", header: "Ngân hàng", width: 24 },
  { field: "accountNumber", header: "Số tài khoản", width: 24 },
  { field: "accountHolder", header: "Chủ tài khoản", width: 28 },
  { field: "branch", header: "Chi nhánh", width: 24 },
];

export const CUSTOMER_CONTACT_COLUMNS = createContactColumns("Mã khách hàng (*)");
export const SUPPLIER_CONTACT_COLUMNS = createContactColumns("Mã nhà cung cấp (*)");
export const CUSTOMER_BANK_COLUMNS = createBankColumns("Mã khách hàng (*)");
export const SUPPLIER_BANK_COLUMNS = createBankColumns("Mã nhà cung cấp (*)");

export const PARTNER_EXCEL_CONFIGS: Record<"customer" | "supplier", PartnerExcelConfig> = {
  customer: {
    entityType: "customer",
    partnerType: PartnerType.CUSTOMER,
    mainSheetName: "Khách hàng",
    columns: CUSTOMER_COLUMNS,
    contactColumns: CUSTOMER_CONTACT_COLUMNS,
    bankColumns: CUSTOMER_BANK_COLUMNS,
    debtSide: DebtSide.RECEIVABLE,
  },
  supplier: {
    entityType: "supplier",
    partnerType: PartnerType.SUPPLIER,
    mainSheetName: "Nhà cung cấp",
    columns: SUPPLIER_COLUMNS,
    contactColumns: SUPPLIER_CONTACT_COLUMNS,
    bankColumns: SUPPLIER_BANK_COLUMNS,
    debtSide: DebtSide.PAYABLE,
  },
};

/** Legacy generic headers accepted for old partner workbooks. */
export const PARTNER_CONTACT_COLUMNS = createContactColumns("Mã đối tác (*)");
export const PARTNER_BANK_COLUMNS = createBankColumns("Mã đối tác (*)");

export interface RawPartnerRow {
  code?: string;
  name: string;
  isOrganization?: boolean;
  groupName?: string;
  taxCode?: string;
  phone?: string;
  email?: string;
  identityCode?: string;
  gender?: string;
  dob?: Date;
  address?: string;
  maxDebtAmount?: number;
  currentDebtAmount?: number;
  representativeName?: string;
  representativePhone?: string;
  representativeEmail?: string;
  representativeIdentityCode?: string;
  note?: string;
}

export interface RawPartnerContactRow {
  partnerCode: string;
  name: string;
  phone?: string;
  email?: string;
  identityCode?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  branch?: string;
}

export interface RawPartnerBankRow {
  partnerCode: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  branch?: string;
}
