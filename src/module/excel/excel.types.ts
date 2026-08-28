export const EXCEL_TYPES = {
  ExcelService: Symbol.for("ExcelService"),
  ExcelController: Symbol.for("ExcelController"),
  ExcelRouter: Symbol.for("ExcelRouter"),
  ProductExcelTemplate: Symbol.for("ProductExcelTemplate"),
  ProductExcelProcessor: Symbol.for("ProductExcelProcessor"),
  PartnerExcelTemplate: Symbol.for("PartnerExcelTemplate"),
  PartnerExcelProcessor: Symbol.for("PartnerExcelProcessor"),
} as const;

export enum ExcelEntityType {
  PRODUCT = "product",
  CUSTOMER = "customer",
  SUPPLIER = "supplier",
}

export const ENTITY_SUPPORTS_IMPORT: Record<ExcelEntityType, boolean> = {
  [ExcelEntityType.PRODUCT]: true,
  [ExcelEntityType.CUSTOMER]: true,
  [ExcelEntityType.SUPPLIER]: true,
};

export enum ImportErrorHandling {
  STOP_ON_ERROR = "stop_on_error",
  SKIP_ERROR = "skip_error",
}

export enum ImportDuplicateHandling {
  STOP = "stop",
  SKIP = "skip",
  UPDATE = "update",
}

export interface ExportColumnConfig {
  field: string;
  header: string;
  width?: number;
  required?: boolean;
  type?: "string" | "number" | "boolean" | "date";
  options?: string[];
  numberFormat?: string;
}

export interface ExportOptions {
  entityType: ExcelEntityType;
  columns?: ExportColumnConfig[];
  extraUnitColumns?: ExportColumnConfig[];
  businessStoreColumns?: ExportColumnConfig[];
  /** Các cột của sheet quan hệ, key là tên worksheet. */
  sheetColumns?: Record<string, ExportColumnConfig[]>;
  filters?: Record<string, any>;
  filename?: string;
}

export interface ExportExcelResult {
  url: string;
  filename: string;
  expiresAt: Date;
}

export interface ImportOptions {
  entityType: ExcelEntityType;
  fileId: string;
  errorHandling: ImportErrorHandling;
  duplicateHandling: ImportDuplicateHandling;
  uniqueFields?: string[];
}

export interface ImportError {
  row: number;
  message: string;
  data?: Record<string, any>;
}

export interface ImportResult {
  totalRows: number;
  successRows: number;
  errorRows: number;
  skippedRows: number;
  errors: ImportError[];
  data: any[];
  errorFileUrl?: string;
}

export interface ImportProgressUpdate {
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  skippedRows: number;
}

export type ImportProgressCallback = (update: ImportProgressUpdate) => void;

export interface ImportJobProgress extends ImportResult {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  processedRows: number;
  layers: string[];
}

export interface TemplateOptions {
  entityType: ExcelEntityType;
}

export interface TemplateResult {
  url: string;
  filename: string;
  entityType: ExcelEntityType;
}
