import { ExportColumnConfig } from "../excel.types";

export const WAREHOUSE_COLUMNS: ExportColumnConfig[] = [
  { field: "code", header: "Mã kho (*)", width: 18, required: true },
  { field: "name", header: "Tên kho (*)", width: 30, required: true },
  { field: "phone", header: "Số điện thoại", width: 18 },
  { field: "address", header: "Địa chỉ", width: 40 },
  { field: "managerCode", header: "Mã người quản lý", width: 20 },
  { field: "note", header: "Ghi chú", width: 30 },
];

export const WAREHOUSE_SHEET_NAMES = { MAIN: "Kho" } as const;

export interface RawWarehouseRow {
  code: string;
  name: string;
  phone?: string;
  address?: string;
  managerCode?: string;
  note?: string;
}
