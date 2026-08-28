import type { Module } from "@/shared/middleware/permission.middleware";

/** Excel chỉ dùng một tập con của các module phân quyền chung. */
export const EXCEL_MODULES = ["product", "customer", "supplier"] as const satisfies readonly Module[];

export interface ExcelRolePermissions {
  importExcel: Module[];
  exportExcel: Module[];
}
