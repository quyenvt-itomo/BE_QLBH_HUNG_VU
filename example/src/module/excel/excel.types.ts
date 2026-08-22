export const EXCEL_TYPES = {
  ExcelService: Symbol.for("ExcelService"),
  ExcelController: Symbol.for("ExcelController"),
  ExcelRouter: Symbol.for("ExcelRouter"),
  // Partner
  PartnerExcelTemplate: Symbol.for("PartnerExcelTemplate"),
  PartnerExcelProcessor: Symbol.for("PartnerExcelProcessor"),
  // Employee
  EmployeeExcelTemplate: Symbol.for("EmployeeExcelTemplate"),
  EmployeeExcelProcessor: Symbol.for("EmployeeExcelProcessor"),
  // User
  UserExcelTemplate: Symbol.for("UserExcelTemplate"),
  UserExcelProcessor: Symbol.for("UserExcelProcessor"),
  // Product
  ProductExcelTemplate: Symbol.for("ProductExcelTemplate"),
  ProductExcelProcessor: Symbol.for("ProductExcelProcessor"),
  // Service
  ServiceExcelTemplate: Symbol.for("ServiceExcelTemplate"),
  ServiceExcelProcessor: Symbol.for("ServiceExcelProcessor"),
  // JobPosition
  JobPositionExcelTemplate: Symbol.for("JobPositionExcelTemplate"),
  JobPositionExcelProcessor: Symbol.for("JobPositionExcelProcessor"),
  // Warehouse
  WarehouseExcelTemplate: Symbol.for("WarehouseExcelTemplate"),
  WarehouseExcelProcessor: Symbol.for("WarehouseExcelProcessor"),
  // PriceHistory (export only)
  PriceHistoryExcelTemplate: Symbol.for("PriceHistoryExcelTemplate"),
};

export enum ExcelEntityType {
  PARTNER = "partner",
  EMPLOYEE = "employee",
  USER = "user",
  PRODUCT = "product",
  SERVICE = "service",
  JOB_POSITION = "job_position",
  WAREHOUSE = "warehouse",
  PRICE_HISTORY = "price_history",
}

export const ENTITY_SUPPORTS_IMPORT: Record<ExcelEntityType, boolean> = {
  [ExcelEntityType.PARTNER]: true,
  [ExcelEntityType.EMPLOYEE]: true,
  [ExcelEntityType.USER]: true,
  [ExcelEntityType.PRODUCT]: true,
  [ExcelEntityType.SERVICE]: true,
  [ExcelEntityType.JOB_POSITION]: true,
  [ExcelEntityType.WAREHOUSE]: true,
  [ExcelEntityType.PRICE_HISTORY]: false,
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
  branchId?: string;
  columns?: ExportColumnConfig[];
  extraUnitColumns?: ExportColumnConfig[];
  filters?: Record<string, any>;
  filename?: string;
}

export interface ExportExcelResult {
  url: string;
  filename: string;
  expiresAt: Date;
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
}

export interface ImportOptions {
  entityType: ExcelEntityType;
  fileId: string;
  branchId?: string;
  errorHandling: ImportErrorHandling;
  duplicateHandling: ImportDuplicateHandling;
  uniqueFields?: string[];
}

export interface ImportJobProgress extends ImportResult {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  layers: string[];
}

export interface TemplateOptions {
  entityType: ExcelEntityType;
  branchId?: string;
}

export interface TemplateResult {
  url: string;
  filename: string;
  entityType: ExcelEntityType;
}
