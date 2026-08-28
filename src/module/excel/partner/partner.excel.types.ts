import { ExportColumnConfig } from "../excel.types";

export const PARTNER_SHEET_NAMES = {
  MAIN: "Đối tác",
  ADDRESSES: "Địa chỉ",
  CONTACTS: "Người liên hệ",
  BANKS: "Ngân hàng",
  GUIDE: "Hướng dẫn",
} as const;

export const PARTNER_COLUMNS: ExportColumnConfig[] = [
  { field: "type", header: "Loại đối tác (*)", width: 22, required: true, options: ["Khách hàng", "Nhà cung cấp", "Đơn vị vận chuyển"] },
  { field: "code", header: "Mã đối tác", width: 20 },
  { field: "name", header: "Tên đối tác (*)", width: 32, required: true },
  { field: "isOrganization", header: "Loại hình", width: 18, options: ["Cá nhân", "Tổ chức"] },
  { field: "groupName", header: "Nhóm đối tác", width: 24 },
  { field: "taxCode", header: "Mã số thuế", width: 20 },
  { field: "phone", header: "Số điện thoại", width: 20 },
  { field: "email", header: "Email", width: 30 },
  { field: "maxDebtAmount", header: "Hạn mức công nợ", width: 20, type: "number", numberFormat: "#,##0.00" },
  { field: "receivableDebtAmount", header: "Công nợ phải thu", width: 20, type: "number", numberFormat: "#,##0.00" },
  { field: "payableDebtAmount", header: "Công nợ phải trả", width: 20, type: "number", numberFormat: "#,##0.00" },
  { field: "representativeName", header: "Tên người đại diện", width: 26 },
  { field: "representativePosition", header: "Chức vụ người đại diện", width: 24 },
  { field: "representativePhone", header: "SĐT người đại diện", width: 20 },
  { field: "representativeEmail", header: "Email người đại diện", width: 28 },
  { field: "representativeIdentityCode", header: "CCCD người đại diện", width: 22 },
  { field: "note", header: "Ghi chú", width: 35 },
];

export const PARTNER_ADDRESS_COLUMNS: ExportColumnConfig[] = [
  { field: "partnerCode", header: "Mã đối tác (*)", width: 20, required: true },
  { field: "state", header: "Tỉnh/Thành phố", width: 24 },
  { field: "ward", header: "Phường/Xã", width: 24 },
  { field: "detail", header: "Địa chỉ chi tiết", width: 42 },
  { field: "isPermanent", header: "Địa chỉ chính", width: 18, options: ["Có", "Không"] },
];

export const PARTNER_CONTACT_COLUMNS: ExportColumnConfig[] = [
  { field: "partnerCode", header: "Mã đối tác (*)", width: 20, required: true },
  { field: "name", header: "Tên người liên hệ (*)", width: 28, required: true },
  { field: "phone", header: "Số điện thoại", width: 20 },
  { field: "email", header: "Email", width: 28 },
  { field: "bankName", header: "Ngân hàng", width: 24 },
  { field: "accountNumber", header: "Số tài khoản", width: 24 },
  { field: "accountHolder", header: "Chủ tài khoản", width: 28 },
  { field: "branch", header: "Chi nhánh", width: 24 },
];

export const PARTNER_BANK_COLUMNS: ExportColumnConfig[] = [
  { field: "partnerCode", header: "Mã đối tác (*)", width: 20, required: true },
  { field: "bankName", header: "Ngân hàng", width: 24 },
  { field: "accountNumber", header: "Số tài khoản", width: 24 },
  { field: "accountHolder", header: "Chủ tài khoản", width: 28 },
  { field: "branch", header: "Chi nhánh", width: 24 },
];

export interface RawPartnerRow {
  type: string;
  code?: string;
  name: string;
  isOrganization?: boolean;
  groupName?: string;
  taxCode?: string;
  phone?: string;
  email?: string;
  maxDebtAmount?: number;
  receivableDebtAmount?: number;
  payableDebtAmount?: number;
  representativeName?: string;
  representativePosition?: string;
  representativePhone?: string;
  representativeEmail?: string;
  representativeIdentityCode?: string;
  note?: string;
}

export interface RawPartnerAddressRow {
  partnerCode: string;
  state?: string;
  ward?: string;
  detail?: string;
  isPermanent: boolean;
}

export interface RawPartnerContactRow {
  partnerCode: string;
  name: string;
  phone?: string;
  email?: string;
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
