export const EXCEL_MODULES = ["product", "partner"] as const;

export type ExcelModule = (typeof EXCEL_MODULES)[number];

export interface ExcelRolePermissions {
  importExcel: ExcelModule[];
  exportExcel: ExcelModule[];
}
