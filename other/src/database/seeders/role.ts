import {
  createPermissionsByContext,
  PERMISSIONS,
} from "@/shared/middleware/permission.middleware";
import { Role } from "../models/store/Role";

const fullPermission = [...PERMISSIONS];

export const roleSeeder: Partial<Role>[] = [
  {
    name: "Quản lý cửa hàng",
    permissions: createPermissionsByContext("store"),
  },
  {
    name: "Nhân viên kinh doanh",
    permissions: {
      ...createPermissionsByContext("store", "empty"),
      purchaseOrder: fullPermission,
      saleOrder: fullPermission,
      supplier: ["read"],
      customer: fullPermission,
    },
  },
  {
    name: "Nhân viên kế toán",
    permissions: {
      ...createPermissionsByContext("store", "empty"),
      debtReport: ["read"],
      debtAdjustment: fullPermission,

      vatReport: ["read"],
      vatAdjustment: fullPermission,

      fund: ["read"],
      incomeExpense: fullPermission,

      supplier: ["read"],
      customer: ["read"],
    },
  },
  {
    name: "Thủ kho",
    permissions: {
      ...createPermissionsByContext("store", "empty"),

      product: ["read"],

      inventoryReport: ["read"],
      inventoryAdjustment: fullPermission,
    },
  },
  {
    name: "Quản lý nhân sự",
    permissions: {
      ...createPermissionsByContext("store", "empty"),

      position: ["read"],
      employee: fullPermission,
    },
  },
];
