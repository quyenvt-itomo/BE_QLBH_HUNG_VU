import { ExportColumnConfig } from "../excel.types";

export const USER_COLUMNS: ExportColumnConfig[] = [
  { field: "code", header: "Mã người dùng (*)", width: 18, required: true },
  { field: "name", header: "Tên người dùng (*)", width: 30, required: true },
  { field: "username", header: "Tên đăng nhập (*)", width: 20, required: true },
  { field: "email", header: "Email", width: 25 },
  { field: "phone", header: "Số điện thoại", width: 18 },
  {
    field: "isActive",
    header: "Kích hoạt",
    width: 14,
    options: ["Có", "Không"],
  },
  { field: "sourceStoreName", header: "Công ty nguồn", width: 25 },
  { field: "note", header: "Ghi chú", width: 30 },
];

export const USER_SHEET_NAMES = { MAIN: "Người dùng" } as const;

export interface RawUserRow {
  code: string;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  isActive?: string;
  sourceStoreName?: string;
  note?: string;
}
