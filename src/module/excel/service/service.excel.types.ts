import { ExportColumnConfig } from "../excel.types";

export const serviceTypeMap: Record<string, string> = {
  in_house: "Nội bộ",
  outsourced: "Thuê ngoài",
};

export const SERVICE_COLUMNS: ExportColumnConfig[] = [
  { field: "code", header: "Mã dịch vụ (*)", width: 20, required: true },
  { field: "name", header: "Tên dịch vụ (*)", width: 30, required: true },
  {
    field: "type",
    header: "Loại (*)",
    width: 18,
    required: true,
    options: Object.values(serviceTypeMap),
  },
  {
    field: "taxRate",
    header: "%VAT",
    width: 12,
    type: "number",
    numberFormat: "#,##0",
  },
  { field: "note", header: "Ghi chú", width: 30 },
];

export const SERVICE_SHEET_NAMES = {
  MAIN: "Dịch vụ",
  UNITS: "Đơn giá & ĐVT",
} as const;

export const SERVICE_UNIT_COLUMNS: ExportColumnConfig[] = [
  { field: "serviceCode", header: "Mã dịch vụ (*)", width: 20, required: true },
  { field: "unitName", header: "Đơn vị tính (*)", width: 20, required: true },
  {
    field: "costPrice",
    header: "Giá đầu vào",
    width: 18,
    type: "number",
    numberFormat: "#,##0",
  },
  {
    field: "unitPrice",
    header: "Giá đầu ra",
    width: 18,
    type: "number",
    numberFormat: "#,##0",
  },
];

export interface RawServiceRow {
  code: string;
  name: string;
  type: string;
  taxRate?: number;
  note?: string;
}
export interface RawServiceUnitRow {
  serviceCode: string;
  unitName: string;
  costPrice?: number;
  unitPrice?: number;
}
