import { ExportColumnConfig } from "../excel.types";

export const productTypeMap: Record<string, string> = {
  finished: "Thành phẩm",
  main_material: "Nguyên liệu chính",
  sub_material: "Nguyên liệu phụ",
};

export const PRODUCT_COLUMNS: ExportColumnConfig[] = [
  { field: "code", header: "Mã hàng hóa (*)", width: 20, required: true },
  { field: "name", header: "Tên hàng hóa (*)", width: 30, required: true },
  {
    field: "type",
    header: "Loại (*)",
    width: 20,
    required: true,
    options: Object.values(productTypeMap),
  },
  { field: "groupName", header: "Nhóm hàng hóa", width: 20 },
  { field: "baseUnitName", header: "Đơn vị tính", width: 18 },
  {
    field: "price",
    header: "Giá",
    width: 18,
    type: "number",
    numberFormat: "#,##0",
  },
  {
    field: "taxRate",
    header: "%VAT",
    width: 12,
    type: "number",
    numberFormat: "#,##0",
  },
  {
    field: "isPublic",
    header: "Công khai",
    width: 12,
    options: ["Có", "Không"],
  },
  { field: "note", header: "Ghi chú", width: 30 },
];

export const PRODUCT_SHEET_NAMES = {
  MAIN: "Hàng hóa",
  EXTRA_UNITS: "Đơn vị tính phụ",
} as const;

export const EXTRA_UNIT_COLUMNS: ExportColumnConfig[] = [
  {
    field: "productCode",
    header: "Mã hàng hóa (*)",
    width: 20,
    required: true,
  },
  {
    field: "unitName",
    header: "Tên đơn vị tính (*)",
    width: 20,
    required: true,
  },
  {
    field: "conversionRate",
    header: "Tỷ lệ quy đổi (*)",
    width: 18,
    type: "number",
    numberFormat: "#,##0.00",
    required: true,
  },
  {
    field: "pricePerUnit",
    header: "Giá",
    width: 18,
    type: "number",
    numberFormat: "#,##0",
  },
];

export interface RawProductRow {
  code: string;
  name: string;
  type: string;
  groupName?: string;
  baseUnitName?: string;
  price?: number;
  taxRate?: number;
  isPublic?: string;
  note?: string;
}

export interface RawExtraUnitRow {
  productCode: string;
  unitName: string;
  conversionRate: number;
  pricePerUnit?: number;
}
