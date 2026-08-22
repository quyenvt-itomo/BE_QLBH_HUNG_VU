import { ExportColumnConfig } from "../excel.types";

export enum ProductKey {
  // String keys
  CODE = "code",
  NAME = "name",
  CATEGORY_NAME = "categoryName",
  UNIT_NAME = "unitName",
  TAX_RATE = "taxRate",

  SPECIFICATION = "specification", // Quy cách (option name) Ví dụ Size: M - Màu: Đỏ
  SKU = "sku", // Mã SKU của biến thể
  BARCODE = "barcode", // Mã vạch của biến thể

  VARIANT_COST_PRICE = "variantCostPrice", // Giá vốn
  VARIANT_PRICE = "variantPrice", // Giá bán
  INITIAL_STOCK = "initialStock", // Tồn kho ban đầu
  NOTE = "note",
}

export type RawProductRow = {
  _rowNumber: number;
  [ProductKey.CODE]: string;
  [ProductKey.NAME]: string;
  [ProductKey.CATEGORY_NAME]?: string;
  [ProductKey.UNIT_NAME]?: string;
  [ProductKey.TAX_RATE]?: number;

  // Variant fields (optional - có thì là variant)
  [ProductKey.SPECIFICATION]?: string;
  [ProductKey.SKU]?: string;
  [ProductKey.BARCODE]?: string;
  [ProductKey.VARIANT_COST_PRICE]?: number;
  [ProductKey.VARIANT_PRICE]?: number;
  [ProductKey.INITIAL_STOCK]?: number;
  [ProductKey.NOTE]?: string;
};

export const PRODUCT_COLUMNS: ExportColumnConfig<ProductKey>[] = [
  {
    field: ProductKey.CODE,
    header: "Mã sản phẩm",
    width: 20,
    required: true,
    type: "string",
  },
  {
    field: ProductKey.NAME,
    header: "Tên sản phẩm",
    width: 30,
    required: true,
    type: "string",
  },
  {
    field: ProductKey.CATEGORY_NAME,
    header: "Danh mục",
    width: 25,
    type: "string",
  },
  {
    field: ProductKey.UNIT_NAME,
    header: "ĐVT",
    width: 20,
    type: "string",
  },
  {
    field: ProductKey.TAX_RATE,
    header: "%VAT",
    width: 15,
    type: "number",
  },
  {
    field: ProductKey.SPECIFICATION,
    header: "Quy cách",
    width: 25,
    type: "string",
  },
  {
    field: ProductKey.SKU,
    header: "Mã SKU",
    width: 20,
    type: "string",
  },
  {
    field: ProductKey.BARCODE,
    header: "Mã vạch",
    width: 20,
    type: "string",
  },
  {
    field: ProductKey.VARIANT_COST_PRICE,
    header: "Giá vốn",
    width: 15,
    type: "number",
  },
  {
    field: ProductKey.VARIANT_PRICE,
    header: "Giá bán",
    width: 15,
    type: "number",
  },
  {
    field: ProductKey.INITIAL_STOCK,
    header: "Tồn kho ban đầu",
    width: 15,
    type: "number",
  },
  {
    field: ProductKey.NOTE,
    header: "Mô tả",
    width: 30,
    type: "string",
  },
] as const;
