import { ExportColumnConfig } from "../excel.types";

export const partnerTypeMap: Record<string, string> = {
  customer: "Khách hàng",
  supplier: "Nhà cung cấp",
  shipping_provider: "Đơn vị vận chuyển",
};

export const PARTNER_COLUMNS: ExportColumnConfig[] = [
  { field: "code", header: "Mã đối tác (*)", width: 20, required: true },
  { field: "name", header: "Tên đối tác (*)", width: 30, required: true },
  {
    field: "types",
    header: "Loại đối tác (*)",
    width: 25,
    required: true,
    options: Object.values(partnerTypeMap),
  },
  { field: "groupName", header: "Nhóm đối tác", width: 20 },
  { field: "taxCode", header: "Mã số thuế", width: 18 },
  { field: "phone", header: "Số điện thoại", width: 18 },
  { field: "email", header: "Email", width: 25 },
  { field: "staffCode", header: "Mã nhân viên phụ trách", width: 22 },
  { field: "paymentTermName", header: "Điều khoản thanh toán", width: 22 },
  { field: "address", header: "Địa chỉ", width: 40 },
  { field: "representativeName", header: "Người đại diện", width: 25 },
  { field: "representativePhone", header: "ĐT người đại diện", width: 20 },
  { field: "bankName", header: "Ngân hàng", width: 20 },
  { field: "bankAccount", header: "Số tài khoản", width: 20 },
  { field: "note", header: "Ghi chú", width: 30 },
];

export const PARTNER_SHEET_NAMES = {
  MAIN: "Đối tác",
} as const;

export interface RawPartnerRow {
  code: string;
  name: string;
  types: string;
  groupName?: string;
  taxCode?: string;
  phone?: string;
  email?: string;
  staffCode?: string;
  paymentTermName?: string;
  address?: string;
  representativeName?: string;
  representativePhone?: string;
  bankName?: string;
  bankAccount?: string;
  note?: string;
}
