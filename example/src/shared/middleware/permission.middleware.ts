import { AuthUtils } from "../utils/auth.utils";

/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../types/errors";
import { JwtPayload } from "../types/interfaces";

/**
 * =========================
 * MODULE DEFINITIONS
 * =========================
 */
export const MODULES = [
  // ===== Reports (read-only) =====
  "report",
  "fundReport", // Báo cáo tồn quỹ
  "fundBalanceReport", // Báo cáo số dư quỹ
  "inventoryReport", // Báo cáo tồn kho
  "partnerDebtReport", // Báo cáo công nợ
  "vatDebtReport", // Báo cáo công nợ thuế GTGT
  "commissionDebtReport", // Báo cáo công nợ hoa hồng
  "purchaseCostReport", // Báo cáo chi phí mua hàng
  "salesCostReport", // Báo cáo chi phí bán hàng
  "productionOutputReport", // Báo cáo công khoán

  // ===== Mua hàng =====
  "purchaseRequisition", // Đề nghị mua vật tư
  "purchaseQuotation", // Báo giá từ nhà cung cấp
  "purchase", // Đơn mua hàng

  // ==== Bán hàng =====
  "quotationRequest", // Đề nghị báo giá từ khách hàng
  "quotation", // Báo giá cho khách hàng
  "order", // Đơn bán hàng

  // Phương án/ Kế hoạch vận chuyển
  "shippingPlan",

  // ===== Kế toán =====
  "paymentRequest", // Đề nghị thanh toán
  "incomeExpense", // Thu chi
  "fund", // Quỹ
  "fundAdjustment", // Điều chỉnh quỹ
  "fundTransfer", // Chuyển quỹ
  "invoice", // Hóa đơn
  "loan", // Khoản vay
  "termDeposit", // Tiền gửi có kỳ hạn (Gửi ngân hàng lấy lãi)
  "asset", // Tài sản cố định
  "partnerDebtAdjustment", // Điều chỉnh công nợ
  "partnerDebtOffset", // Đối trừ công nợ
  "vatDebtAdjustment", // Điều chỉnh công nợ thuế GTGT
  "commissionDebtAdjustment", // Điều chỉnh công nợ hoa hồng

  // ===== Kho và mua hàng =====
  "warehouse", // Kho
  "warehouseTransfer", // Chuyển kho/ Lệnh điều động
  "inventoryAdjustment", // Điều chỉnh tồn kho
  "stockDocument", // Chứng từ xuất nhập kho
  "gateLog", // Nhật ký ra vào cổng

  // ===== Sản xuất =====
  "bom", // Định mức nguyên vật liệu
  "production", // Lệnh sản xuất
  "materialBugget", // Dự trù vật tư
  "meshSheet", // Thông số lưới thép hàn

  // ===== Kho mở rộng =====
  "inventoryConversion", // Chuyển mã

  // ===== Nhân sự =====
  "employee", // Hồ sơ nhân sự
  "payroll", // Bảng lương

  // ===== Thiết lập tổ chức =====
  "organization", // Cơ cấu tổ chức
  "jobPosition", // Vị trí công việc
  "paymentTerm", // Điều khoản thanh toán

  // ===== Core entities / danh mục =====
  "partner", // Đối tác (khách hàng, nhà cung cấp)
  "product", // Vật tư/ hàng hóa
  "priceHistory", // Lịch sử giá
  "service", // Dịch vụ
  "user", // Người dùng hệ thống
  "role", // Vai trò/ nhóm quyền
  "category", // Attribute / Thuộc tính

  // ===== An toàn và bảo mật =====
  "log", // Nhật ký hệ thống
  "loginApproval", // Xác thực đăng nhập thiết bị mới
] as const;

export type Module = (typeof MODULES)[number];

/**
 * =========================
 * PERMISSIONS
 * =========================
 */
export const PERMISSIONS = [
  "create",
  "read",
  "readAll",
  "update",
  "delete",
  "approve",
  "customerApprove",
  "confirmExport",
  "confirmImport",
  "complete",
  "enter",
  "exit",
  "link",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export type PermissionStructure = {
  [key in Module]?: Permission[];
};

/**
 * Các module chỉ có quyền read theo từng context
 */
export const ReadOnlyModules: Module[] = [
  "report",
  "fundReport",
  "inventoryReport",
  "partnerDebtReport",
  "vatDebtReport",
  "purchaseCostReport",
  "salesCostReport",
  "productionOutputReport",
  "materialBugget",
  "priceHistory",

  "quotationRequest",
  "purchaseQuotation",
  "order",
];

/**
 * Các module cần quyền readAll để xem toàn bộ dữ liệu
 */
export const ReadAllModules: Module[] = [
  "quotation",
  "order",
  "purchaseQuotation",
  "purchase",

  "partner",
];

/**
 * Các module cần quyền approve
 */
export const ApprovalModules: Module[] = [
  "quotationRequest",
  "quotation",
  "order",
  "purchaseRequisition",
  "purchaseQuotation",
  "purchase",
  "shippingPlan",
  "paymentRequest",
];

/**
 * Các module đặc biệt
 */
export const CustomerApprovalModules: Module[] = ["quotation"];
export const ConfirmExportModules: Module[] = ["stockDocument"];
export const ConfirmImportModules: Module[] = ["stockDocument"];
export const CompleteModules: Module[] = [
  "purchase",
  "order",
  "production",
  "stockDocument",
];

export const readPermissionFallbackMap: Partial<Record<Module, Module[]>> = {
  product: [
    "quotation",
    "order",
    "purchaseRequisition",
    "purchase",

    "stockDocument",
    "warehouseTransfer",
    "inventoryConversion",
    "inventoryAdjustment",

    "bom",
    "production",
    "meshSheet",
  ],
  service: ["quotation", "order"],
  fund: ["incomeExpense", "fundTransfer", "fundAdjustment"],
  partner: [
    "quotation",
    "order",
    "purchase",
    "invoice",
    "incomeExpense",
    "paymentRequest",
  ],
  category: ["product", "partner", "incomeExpense"],
  warehouse: [
    "stockDocument",
    "inventoryAdjustment",
    "inventoryConversion",
    "warehouseTransfer",
  ],
  employee: [
    "quotation",
    "order",
    "purchaseRequisition",
    "purchase",
    "incomeExpense",
    "warehouse",
    "stockDocument",
    "warehouseTransfer",
    "gateLog",
    "production",
    "payroll",

    "organization",
  ],
};

const checkPermissionFallback = (
  permissions?: Partial<PermissionStructure>,
  module?: Module,
): boolean => {
  if (!module || !permissions) return true;

  const fallbackModules = readPermissionFallbackMap[module] || [];

  for (const fallbackModule of fallbackModules) {
    if (permissions[fallbackModule]?.includes("create")) {
      return true;
    }
  }

  return false;
};

export const checkPermission = (
  req: Request,
  module: Module,
  permission: Permission,
): boolean => {
  const permissions = ((req as any).permissions as PermissionStructure) || {};
  const modulePermissions = permissions[module] || [];
  if (modulePermissions.includes(permission)) {
    return true;
  }

  if (permission === "read") {
    return checkPermissionFallback(permissions, module);
  }

  return false;
};

/**
 *
 * @param module
 * @param permission
 * @returns
 */
export const permissionMiddleware = (
  module: Module | ((req: Request) => Module),
  permission: Permission,
) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userJwt = (req as any).user as JwtPayload;
      if (!userJwt?.userId) {
        throw new UnauthorizedError("Người dùng chưa đăng nhập");
      }

      if (AuthUtils.isAdmin(userJwt)) return next();

      const resolvedModule =
        typeof module === "function" ? module(req) : module;

      if (checkPermission(req, resolvedModule, permission)) {
        const employeeId = req?.userContext?.employeeId;
        // TODO: ReadAll
        // Nếu là quyền read thì phải kiểm tra quyền xem tất cả
        // Nếu người này không có quyền xem tất cả thì thêm staffId = employeeId vào query để chỉ xem dữ liệu của mình
        if (
          ReadAllModules.includes(resolvedModule) &&
          permission === "read" &&
          !checkPermission(req, resolvedModule, "readAll") &&
          !!employeeId
        ) {
        }

        return next();
      }

      throw new ForbiddenError(
        permission === "read"
          ? "Bạn không có quyền truy cập dữ liệu này"
          : "Bạn không có quyền thực hiện thao tác này",
      );
    } catch (error) {
      console.error(
        `Permission error on module ${typeof module === "string" ? module : "[dynamic]"}`,
        error,
      );
      next(error);
    }
  };
};

export function createPermissions(
  mode: "empty" | "full" = "full",
): PermissionStructure {
  const permissions: PermissionStructure = {};

  for (const m of MODULES) {
    if (mode === "empty") {
      permissions[m] = [];
      continue;
    }

    // full
    if (ReadOnlyModules.includes(m)) {
      permissions[m] = ["read"];
    } else {
      permissions[m] = ["create", "read", "update", "delete"];
    }

    if (ReadAllModules.includes(m)) {
      permissions[m].push("readAll");
    }

    if (ApprovalModules.includes(m)) {
      permissions[m].push("approve");
    }

    if (CustomerApprovalModules.includes(m))
      permissions[m].push("customerApprove");
    if (ConfirmExportModules.includes(m)) permissions[m].push("confirmExport");
    if (ConfirmImportModules.includes(m)) permissions[m].push("confirmImport");
    if (CompleteModules.includes(m)) permissions[m].push("complete");
    if (m === "gateLog") {
      permissions[m] = ["read", "enter", "exit", "link"];
    }
  }

  return permissions;
}
