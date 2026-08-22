import { ExportColumnConfig } from "../excel.types";

/**
 * Enum cho các trường của sheet Bán hàng (Sales)
 */
export enum SalesSheetKey {
  DATE = "date", // Ngày
  ORDER_COUNT = "orderCount", // Số đơn
  GROSS_AMOUNT = "grossAmount", // Tiền hàng
  LINE_DISCOUNT = "lineDiscount", // Giảm giá hàng
  ORDER_DISCOUNT = "orderDiscount", // Giảm giá đơn
  NET_AMOUNT = "netAmount", // Doanh thu thuần
  SHIPPING_FEE = "shippingFee", // Phí giao hàng
  TAX_AMOUNT = "taxAmount", // Tiền thuế
  TOTAL_AMOUNT = "totalAmount", // Tổng doanh thu
  GROSS_PROFIT = "grossProfit", // Lợi nhuận gộp
  GROSS_PROFIT_MARGIN = "grossProfitMargin", // Tỷ suất lợi nhuận gộp
}

/**
 * Enum cho các trường của sheet Lợi nhuận (Profit)
 */
export enum ProfitSheetKey {
  DATE = "date", // Ngày
  SALES_REVENUE = "salesRevenue", // Doanh thu bán hàng
  COGS = "cogs", // Giá vốn hàng bán
  SHIPPING_EXPENSE = "shippingExpense", // Phí vận chuyển
  GROSS_PROFIT = "grossProfit", // Lợi nhuận gộp
  OTHER_INCOME = "otherIncome", // Doanh thu khác
  TOTAL_REVENUE = "totalRevenue", // Tổng doanh thu
  OTHER_EXPENSE = "otherExpense", // Chi phí
  INVENTORY_ADJUSTMENT = "inventoryAdjustment", // ĐC tồn kho
  PARTNER_DEBT_ADJUSTMENT = "partnerDebtAdjustment", // ĐC công nợ
  FUND_ADJUSTMENT = "fundAdjustment", // ĐC số dư quỹ
  TOTAL_ADJUSTMENTS = "totalAdjustments", // Tổng điều chỉnh
  NET_PROFIT = "netProfit", // Lợi nhuận ròng
  NET_PROFIT_MARGIN = "netProfitMargin", // Tỷ suất lợi nhuận ròng
}

/**
 * Cấu hình cột cho sheet Bán hàng
 */
const SALES_SHEET_NAME = "Bán hàng";
const PROFIT_SHEET_NAME = "Lợi nhuận";

export const SALES_SHEET_COLUMNS: ExportColumnConfig<SalesSheetKey>[] = [
  {
    field: SalesSheetKey.DATE,
    header: "Ngày",
    width: 15,
    type: "string",
    sheet: SALES_SHEET_NAME,
  },
  {
    field: SalesSheetKey.ORDER_COUNT,
    header: "Số đơn",
    width: 12,
    type: "number",
    sheet: SALES_SHEET_NAME,
  },
  {
    field: SalesSheetKey.GROSS_AMOUNT,
    header: "Tiền hàng",
    width: 18,
    type: "number",
    sheet: SALES_SHEET_NAME,
  },
  {
    field: SalesSheetKey.LINE_DISCOUNT,
    header: "Giảm giá hàng",
    width: 18,
    type: "number",
    sheet: SALES_SHEET_NAME,
  },
  {
    field: SalesSheetKey.ORDER_DISCOUNT,
    header: "Giảm giá đơn",
    width: 18,
    type: "number",
    sheet: SALES_SHEET_NAME,
  },
  {
    field: SalesSheetKey.NET_AMOUNT,
    header: "Doanh thu thuần",
    width: 18,
    type: "number",
    sheet: SALES_SHEET_NAME,
  },
  {
    field: SalesSheetKey.SHIPPING_FEE,
    header: "Phí giao hàng",
    width: 16,
    type: "number",
    sheet: SALES_SHEET_NAME,
  },
  {
    field: SalesSheetKey.TAX_AMOUNT,
    header: "Tiền thuế",
    width: 16,
    type: "number",
    sheet: SALES_SHEET_NAME,
  },
  {
    field: SalesSheetKey.TOTAL_AMOUNT,
    header: "Tổng doanh thu",
    width: 18,
    type: "number",
    sheet: SALES_SHEET_NAME,
  },
  {
    field: SalesSheetKey.GROSS_PROFIT,
    header: "Lợi nhuận gộp",
    width: 18,
    type: "number",
    sheet: SALES_SHEET_NAME,
  },
  {
    field: SalesSheetKey.GROSS_PROFIT_MARGIN,
    header: "Tỷ suất LN gộp",
    width: 16,
    type: "number",
    sheet: SALES_SHEET_NAME,
  },
];

/**
 * Cấu hình cột cho sheet Lợi nhuận
 */
export const PROFIT_SHEET_COLUMNS: ExportColumnConfig<ProfitSheetKey>[] = [
  {
    field: ProfitSheetKey.DATE,
    header: "Ngày",
    width: 15,
    type: "string",
    sheet: PROFIT_SHEET_NAME,
  },
  {
    field: ProfitSheetKey.SALES_REVENUE,
    header: "Doanh thu bán hàng",
    width: 22,
    type: "number",
    sheet: PROFIT_SHEET_NAME,
  },
  {
    field: ProfitSheetKey.COGS,
    header: "Giá vốn hàng bán",
    width: 20,
    type: "number",
    sheet: PROFIT_SHEET_NAME,
  },
  {
    field: ProfitSheetKey.SHIPPING_EXPENSE,
    header: "Phí vận chuyển",
    width: 18,
    type: "number",
    sheet: PROFIT_SHEET_NAME,
  },
  {
    field: ProfitSheetKey.GROSS_PROFIT,
    header: "Lợi nhuận gộp",
    width: 18,
    type: "number",
    sheet: PROFIT_SHEET_NAME,
  },
  {
    field: ProfitSheetKey.OTHER_INCOME,
    header: "Doanh thu khác",
    width: 18,
    type: "number",
    sheet: PROFIT_SHEET_NAME,
  },
  {
    field: ProfitSheetKey.TOTAL_REVENUE,
    header: "Tổng doanh thu",
    width: 18,
    type: "number",
    sheet: PROFIT_SHEET_NAME,
  },
  {
    field: ProfitSheetKey.OTHER_EXPENSE,
    header: "Chi phí",
    width: 18,
    type: "number",
    sheet: PROFIT_SHEET_NAME,
  },
  {
    field: ProfitSheetKey.INVENTORY_ADJUSTMENT,
    header: "ĐC tồn kho",
    width: 16,
    type: "number",
    sheet: PROFIT_SHEET_NAME,
  },
  {
    field: ProfitSheetKey.PARTNER_DEBT_ADJUSTMENT,
    header: "ĐC công nợ",
    width: 16,
    type: "number",
    sheet: PROFIT_SHEET_NAME,
  },
  {
    field: ProfitSheetKey.FUND_ADJUSTMENT,
    header: "ĐC số dư quỹ",
    width: 16,
    type: "number",
    sheet: PROFIT_SHEET_NAME,
  },
  {
    field: ProfitSheetKey.TOTAL_ADJUSTMENTS,
    header: "Tổng điều chỉnh",
    width: 18,
    type: "number",
    sheet: PROFIT_SHEET_NAME,
  },
  {
    field: ProfitSheetKey.NET_PROFIT,
    header: "Lợi nhuận ròng",
    width: 18,
    type: "number",
    sheet: PROFIT_SHEET_NAME,
  },
  {
    field: ProfitSheetKey.NET_PROFIT_MARGIN,
    header: "Tỷ suất LN ròng",
    width: 16,
    type: "number",
    sheet: PROFIT_SHEET_NAME,
  },
];

/**
 * Dữ liệu một dòng trong sheet Bán hàng
 */
export interface SalesDailyRow {
  date: string;
  orderCount: number;
  grossAmount: number;
  lineDiscount: number;
  orderDiscount: number;
  netAmount: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  grossProfit: number;
  grossProfitMargin: number;
}

/**
 * Dữ liệu một dòng trong sheet Lợi nhuận
 */
export interface ProfitDailyRow {
  date: string;
  salesRevenue: number;
  cogs: number;
  shippingExpense: number;
  grossProfit: number;
  otherIncome: number;
  totalRevenue: number;
  otherExpense: number;
  inventoryAdjustment: number;
  partnerDebtAdjustment: number;
  fundAdjustment: number;
  totalAdjustments: number;
  netProfit: number;
  netProfitMargin: number;
}

/**
 * Filters cho export dashboard
 */
export interface DashboardExportFilters {
  storeId?: string;
  startAt: string;
  endAt: string;
  timezone?: string;
}

// ========== Column Metadata cho FE ==========

/**
 * Gom tất cả cột của dashboard (cả 2 sheet) vào 1 mảng phẳng
 * Có kèm thuộc tính `sheet` để FE nhóm theo sheet
 */
export const DASHBOARD_ALL_COLUMNS: ExportColumnConfig[] = [
  ...SALES_SHEET_COLUMNS,
  ...PROFIT_SHEET_COLUMNS,
];

/**
 * Cấu trúc metadata cột xuất Excel nhóm theo sheet
 * FE dùng để hiển thị UI tùy chọn cột với section rõ ràng
 */
export interface DashboardColumnsMeta {
  /** Danh sách sheet kèm cột tương ứng */
  sheets: Array<{
    /** Tên sheet */
    name: string;
    /** Các cột thuộc sheet này */
    columns: ExportColumnConfig[];
  }>;
  /** Tổng số cột (để FE hiển thị badge) */
  totalColumns: number;
}

/**
 * Metadata cột cho dashboard - gom sẵn theo sheet
 */
export const DASHBOARD_COLUMNS_META: DashboardColumnsMeta = {
  sheets: [
    {
      name: SALES_SHEET_NAME,
      columns: [...SALES_SHEET_COLUMNS],
    },
    {
      name: PROFIT_SHEET_NAME,
      columns: [...PROFIT_SHEET_COLUMNS],
    },
  ],
  totalColumns: SALES_SHEET_COLUMNS.length + PROFIT_SHEET_COLUMNS.length,
};
