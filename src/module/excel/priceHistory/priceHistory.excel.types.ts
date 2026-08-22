import { ExportColumnConfig } from "../excel.types";

export const PRICE_HISTORY_COLUMNS: ExportColumnConfig[] = [
  { field: "productCode", header: "Mã hàng hóa", width: 20 },
  { field: "productName", header: "Tên hàng hóa", width: 30 },
  { field: "unitName", header: "Đơn vị tính", width: 18 },
  {
    field: "pricePerUnit",
    header: "Giá",
    width: 18,
    type: "number",
    numberFormat: "#,##0",
  },
  { field: "createdAt", header: "Ngày cập nhật", width: 20, type: "date" },
  { field: "note", header: "Ghi chú", width: 30 },
];

export const PRICE_HISTORY_SHEET_NAMES = { MAIN: "Lịch sử giá" } as const;
