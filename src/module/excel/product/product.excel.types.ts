import { ExportColumnConfig } from "../excel.types";

export const PRODUCT_SHEET_NAMES = {
  MAIN: "Hàng hóa",
  EXTRA_UNITS: "Đơn vị tính phụ",
  BUSINESS_STORES: "Cửa hàng kinh doanh",
  GUIDE: "Hướng dẫn",
} as const;

export const PRODUCT_GROUP_PATH_SEPARATOR = ">>";

export const PRODUCT_COLUMNS: ExportColumnConfig[] = [
  { field: "code", header: "Mã hàng hóa (*)", width: 20, required: true },
  { field: "name", header: "Tên hàng hóa (*)", width: 30, required: true },
  { field: "barcode", header: "Mã vạch", width: 20 },
  { field: "groupName", header: "Nhóm hàng hóa", width: 22 },
  { field: "brandName", header: "Thương hiệu", width: 22 },
  { field: "baseUnitName", header: "Đơn vị tính", width: 18 },
  {
    field: "salePrice",
    header: "Giá bán",
    width: 18,
    type: "number",
    numberFormat: "#,##0",
  },
  {
    field: "weight",
    header: "Trọng lượng",
    width: 16,
    type: "number",
    numberFormat: "#,##0.00",
  },
  {
    field: "weightUnit",
    header: "ĐVT trọng lượng",
    width: 18,
    options: ["g", "kg"],
  },
  { field: "description", header: "Mô tả", width: 35 },
  { field: "note", header: "Ghi chú", width: 30 },
];

export const PRODUCT_EXTRA_UNIT_COLUMNS: ExportColumnConfig[] = [
  {
    field: "productCode",
    header: "Mã hàng hóa (*)",
    width: 20,
    required: true,
  },
  {
    field: "unitName",
    header: "Tên đơn vị tính (*)",
    width: 22,
    required: true,
  },
  {
    field: "conversionRate",
    header: "Tỷ lệ quy đổi (*)",
    width: 18,
    type: "number",
    numberFormat: "#,##0.0000",
  },
  {
    field: "salePrice",
    header: "Giá bán theo ĐVT",
    width: 20,
    type: "number",
    numberFormat: "#,##0",
  },
  {
    field: "isPurchaseUnit",
    header: "ĐVT nhập hàng mặc định",
    width: 25,
    options: ["Có", "Không"],
  },
];

export const PRODUCT_BUSINESS_STORE_COLUMNS: ExportColumnConfig[] = [
  {
    field: "productCode",
    header: "Mã hàng hóa (*)",
    width: 20,
    required: true,
  },
  {
    field: "storeCode",
    header: "Mã cửa hàng (*)",
    width: 20,
    required: true,
  },
  { field: "storeName", header: "Tên cửa hàng", width: 30 },
  {
    field: "costPrice",
    header: "Giá vốn",
    width: 18,
    type: "number",
    numberFormat: "#,##0",
  },
  {
    field: "isSelling",
    header: "Đang kinh doanh",
    width: 20,
    options: ["Có", "Không"],
  },
];

export interface RawProductRow {
  code: string;
  name: string;
  barcode?: string;
  groupName?: string;
  brandName?: string;
  baseUnitName?: string;
  salePrice?: number;
  weight?: number;
  weightUnit?: string;
  description?: string;
  note?: string;
}

export interface RawExtraUnitRow {
  productCode: string;
  unitName: string;
  conversionRate: number;
  salePrice: number;
  isPurchaseUnit: boolean;
}

export interface RawBusinessStoreRow {
  productCode: string;
  storeCode: string;
  storeName?: string;
  costPrice?: number;
  isSelling: boolean;
}
