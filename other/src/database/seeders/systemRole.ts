import { SystemRole } from "../models/SystemRole";
import {
  createPermissionsByContext,
  PERMISSIONS,
} from "@/shared/middleware/permission.middleware";

const fullPermission = [...PERMISSIONS];

export const systemRoleSeeder: Partial<SystemRole>[] = [
  {
    name: "Quản trị viên hệ thống",
    permissions: createPermissionsByContext("system"),
  },
  {
    name: "Quản trị dữ liệu",
    permissions: {
      ...createPermissionsByContext("system", "empty"),
      product: fullPermission,
      category: fullPermission,
      unit: fullPermission,
      productType: fullPermission,
      position: fullPermission,
    },
  },
  {
    name: "Quản trị người dùng",
    permissions: {
      ...createPermissionsByContext("system", "empty"),
      user: fullPermission,
      systemPermission: fullPermission,
    },
  },
  {
    name: "Quản trị hàng hóa",
    permissions: {
      ...createPermissionsByContext("system", "empty"),
      product: fullPermission,
      inventoryReport: ["read"],
      inventoryAdjustment: ["read"],
    },
  },
  {
    name: "Quản trị kinh doanh",
    permissions: {
      ...createPermissionsByContext("system", "empty"),
      purchaseOrder: ["read"],
      saleOrder: ["read"],

      fund: ["read"],
      fundReport: ["read"],

      debtReport: ["read"],
      debtAdjustment: ["read"],

      vatReport: ["read"],
      vatAdjustment: ["read"],
    },
  },
  {
    name: "Quản trị đối tác",
    permissions: {
      ...createPermissionsByContext("system", "empty"),
      customer: fullPermission,
      supplier: fullPermission,
      debtReport: ["read"],
      debtAdjustment: ["read"],
    },
  },
];
