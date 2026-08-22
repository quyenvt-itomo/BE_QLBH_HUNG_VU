export const EXCEL_TYPES = {
  ExcelService: Symbol.for("ExcelService"),
  ExcelController: Symbol.for("ExcelController"),
  ExcelRouter: Symbol.for("ExcelRouter"),
  ProductExcelTemplate: Symbol.for("ProductExcelTemplate"),
  ProductExcelProcessor: Symbol.for("ProductExcelProcessor"),
  CustomerExcelTemplate: Symbol.for("CustomerExcelTemplate"),
  CustomerExcelProcessor: Symbol.for("CustomerExcelProcessor"),
  SaleOrderExcelTemplate: Symbol.for("SaleOrderExcelTemplate"),
  SaleOrderExcelProcessor: Symbol.for("SaleOrderExcelProcessor"),
  InventoryAdjustmentExcelTemplate: Symbol.for(
    "InventoryAdjustmentExcelTemplate",
  ),
  InventoryReportExcelTemplate: Symbol.for("InventoryReportExcelTemplate"),
  DashboardExcelTemplate: Symbol.for("DashboardExcelTemplate"),
  IncomeExpenseExcelTemplate: Symbol.for("IncomeExpenseExcelTemplate"),
};

// Các loại entity có thể export/import
export enum ExcelEntityType {
  PRODUCT = "product",
  PARTNER = "partner",
  CUSTOMER = "customer",
  EMPLOYEE = "employee",
  SALE_ORDER = "sale_order",
  // Có thể mở rộng thêm
  INVENTORY_ADJUSTMENT = "inventory_adjustment",
  INVENTORY_REPORT = "inventory_report",
  DASHBOARD = "dashboard",
  INCOME_EXPENSE = "income_expense",
}

// Các options khi import
export enum ImportErrorHandling {
  STOP_ON_ERROR = "stop_on_error", // Dừng lại khi có lỗi
  SKIP_ERROR = "skip_error", // Bỏ qua dòng lỗi
}

export enum ImportDuplicateHandling {
  STOP = "stop", // Dừng lại báo trùng
  SKIP = "skip", // Bỏ qua dòng trùng
  UPDATE = "update", // Cập nhật thông tin mới
}

// Column configuration for export
export interface ExportColumnConfig<K extends string = string> {
  field: K; // key chuẩn (enum / union)
  header: string; // header Excel
  width?: number;
  format?: string;
  required?: boolean;
  type?: "string" | "number" | "boolean" | "date";
  sheet?: string;
}

// Export options
export interface ExportOptions {
  storeId?: string; // Cho các entity cần context cửa hàng
  entityType: ExcelEntityType;
  columns?: ExportColumnConfig[]; // Các cột cần export (optional khi dùng includeStock)
  filters?: Record<string, any>; // Filters để lọc data
  filename?: string; // Tên file
  includeStock?: boolean; // Có bao gồm tồn kho và giá trị tồn không
}

// Import options
export interface ImportOptions {
  entityType: ExcelEntityType;
  fileId: string; // ID của file đã upload
  errorHandling: ImportErrorHandling;
  duplicateHandling: ImportDuplicateHandling;
  uniqueFields?: string[]; // Các field dùng để check duplicate (mặc định: code)
  storeId?: string; // Cho các entity cần context cửa hàng
}

// Template generation options
export interface TemplateOptions {
  entityType: ExcelEntityType;
  storeId?: string; // Cho các template cần context (đối soát kho, etc.)
  filters?: Record<string, any>; // Các filters khác
  metadata?: Record<string, any>; // Metadata bổ sung
}

// Template result
export interface TemplateResult {
  url: string; // URL để tải template
  filename: string; // Tên file
  expiresAt?: Date; // Thời gian hết hạn (cho temp files)
}

// Import job progress
export interface ImportJobProgress {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number; // 0-100 (tổng thể)
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  skippedRows: number;
  errors: ImportError[];
  startedAt: Date;
  completedAt?: Date;
  result?: ImportResult;
  layers?: ImportLayerProgress[]; // Chi tiết tiến độ từng layer
}

// Layer progress (cho SSE chi tiết)
export interface ImportLayerProgress {
  label: string; // "Validation", "Import", "Recalculation"
  progress: number; // 0-100
  status: "pending" | "processing" | "completed" | "failed";
}

// Import result
export interface ImportResult {
  totalRows: number;
  successRows: number;
  errorRows: number;
  skippedRows: number;
  errors: ImportError[];
  data?: any[]; // Dữ liệu đã import thành công
  errorFileUrl?: string; // URL file Excel có đánh dấu lỗi
  layers?: ImportLayerProgress[]; // Chi tiết tiến độ từng layer
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  value?: any;
  column?: string | number; // Column letter hoặc index trong Excel
}

// Product specific types
export interface ProductExportData {
  // Product info
  code: string;
  name: string;
  categoryCode?: string;
  categoryName?: string;
  unitCode?: string;
  unitName?: string;
  taxRate?: number;

  // Variant info
  variantSku?: string;
  variantBarcode?: string;
  variantCostPrice?: number;
  variantPrice?: number;
  variantIsActive?: boolean;

  // Options (dynamic columns)
  [key: string]: any; // option_type1, option_type2, etc.
}

export interface ProductImportRow {
  code: string;
  name: string;
  categoryCode?: string;
  unitCode?: string;
  taxRate?: number;
  hasVariant?: boolean;

  // Variant
  variantSku?: string;
  variantBarcode?: string;
  variantCostPrice?: number;
  variantPrice?: number;
  variantIsActive?: boolean;

  // Options
  options?: Record<string, string>; // { typeCode: value }
}
