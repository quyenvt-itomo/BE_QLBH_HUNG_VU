/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../types/errors";

/**
 * =========================
 * MODULE DEFINITIONS
 * =========================
 */
export const MODULES = [
  // ===== Reports (read-only) =====
  "report",
  "inventoryReport",
  "debtReport",
  "fundReport",
  "vatReport",
  "loyaltyPointReport",

  // ===== Core entities / danh mục =====
  "user",
  "systemPermission",
  "store",
  "storeUser",
  "permission",

  "product",
  "customer",
  "supplier",
  "fund",

  // ===== Attribute / master data =====
  "position",
  "category",
  "unit",
  "productType",

  // ===== Business / giao dịch =====
  "saleOrder",
  "purchaseOrder",
  "saleReturn",
  "purchaseReturn",
  "shift",

  // ===== Finance =====
  "incomeExpense",
  "fundTransfer",
  "fundAdjustment",

  // ===== Inventory =====
  "inventoryAdjustment",
  "storeTransfer",

  // ===== Debt =====
  "debtAdjustment",
  "debtOffset",

  // ===== VAT =====
  "vatAdjustment",

  // ===== Loyalty Points =====
  "loyaltyPointAdjustment",

  // ===== HR =====
  "employee",
] as const;

export type Module = (typeof MODULES)[number];

/**
 * =========================
 * PERMISSIONS
 * =========================
 */
export const PERMISSIONS = ["create", "read", "update", "delete"] as const;
export type Permission = (typeof PERMISSIONS)[number];

export type PermissionStructure = {
  [key in Module]?: Permission[];
};

/**
 * =========================
 * PERMISSION CONTEXT
 * =========================
 */
export type PermissionContext = "store" | "system";

/**
 * Các module chỉ có quyền read theo từng context
 */
export const ReadOnlyModulesByContext: Record<PermissionContext, Module[]> = {
  store: [
    // Core
    "user",
    "store",
    // "product",
    "supplier",

    // Attribute
    // "position",
    // "category",
    // "unit",
    // "productType",

    // Reports
    "report",
    "inventoryReport",
    "debtReport",
    "vatReport",
    "loyaltyPointReport",
  ],

  system: [
    // Business
    "saleOrder",
    "purchaseOrder",
    "saleReturn",
    "purchaseReturn",
    "incomeExpense",
    "shift",

    // Reports
    "fundReport",
    "inventoryReport",
    "debtReport",
    "vatReport",
    "loyaltyPointReport",

    // Adjustment
    "inventoryAdjustment",
    "debtAdjustment",
    "vatAdjustment",

    // HR / Permission
    // "employee",
    "permission",
  ],
};

/**
 * Các module KHÔNG tồn tại trong store
 */
export const NotInStoreModules: Module[] = [
  "systemPermission",
  "productType",

  // Inventory (system-level)
  "storeTransfer",
];

export const permissionMiddleware = (
  module: Module | ((req: Request) => Module),
  permission: Permission,
) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userJwt = req.user as any;
      if (!userJwt?.userId) {
        throw new UnauthorizedError("User not authenticated");
      }

      if (userJwt.username === "admin") return next();

      const resolvedModule =
        typeof module === "function" ? module(req) : module;

      const permissions = req.permissions || {};
      const modulePermissions = permissions[resolvedModule] || [];

      // Enforce read before write
      if (permission !== "read" && !modulePermissions.includes("read")) {
        throw new ForbiddenError("Read permission required");
      }

      if (!modulePermissions.includes(permission)) {
        throw new ForbiddenError("Insufficient permissions");
      }

      return next();
    } catch (error) {
      console.error(
        `Permission error on module ${typeof module === "string" ? module : "[dynamic]"}`,
        error,
      );
      next(error);
    }
  };
};

export function createPermissionsByContext(
  context: PermissionContext,
  mode: "empty" | "full" = "full",
): PermissionStructure {
  const permissions: PermissionStructure = {};

  for (const m of MODULES) {
    if (NotInStoreModules.includes(m) && context === "store") continue;

    if (mode === "empty") {
      permissions[m] = [];
      continue;
    }

    // full
    if (ReadOnlyModulesByContext[context].includes(m)) {
      permissions[m] = ["read"];
    } else {
      permissions[m] = [...PERMISSIONS];
    }
  }

  return permissions;
}

export const PermissionContextMap: Record<
  PermissionContext,
  {
    modules: Module[];
    permissions: Permission[];
    notInStoreModules?: Module[];
    readOnlyModules?: Module[];
    emptyPermissions: PermissionStructure;
  }
> = {
  store: {
    modules: [...MODULES],
    permissions: [...PERMISSIONS],
    notInStoreModules: NotInStoreModules,
    readOnlyModules: ReadOnlyModulesByContext.store,
    emptyPermissions: createPermissionsByContext("store", "empty"),
  },

  system: {
    modules: [...MODULES],
    permissions: [...PERMISSIONS],
    readOnlyModules: ReadOnlyModulesByContext.system,
    emptyPermissions: createPermissionsByContext("system", "empty"),
  },
};

export function getPermissionContext(context: PermissionContext) {
  return PermissionContextMap[context];
}
