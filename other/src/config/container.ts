import { Container } from "inversify";

import { authModule } from "@/modules/auth";

// TODO: ======== GLOBAL MODULES ========
import { notificationModule } from "@/modules/notification";
import { userModule } from "@/modules/user";
import { verifyOtpModule } from "@/modules/verifyOtp";
import { storeModule } from "@/modules/store";
import { fileModule } from "@/modules/file";
import { systemRoleModule } from "@/modules/systemRole";
import { attributeModule } from "@/modules/attribute";

import {
  productModule,
  productOptionModule,
  productVariantModule,
} from "@/modules/product";

import {
  partnerModule,
  partnerContactModule,
  partnerSubTypeModule,
} from "@/modules/partner";

import {
  storeTransferModule,
  storeTransferLineModule,
} from "@/modules/storeTransfer";

import { fundModule } from "@/modules/fund";
import { fundCategoryModule } from "@/modules/fundCategory";
import { fundAdjustmentModule } from "@/modules/fundAdjustment";
import { fundTransferModule } from "@/modules/fundTransfer";

import { fundTransactionModule } from "@/modules/fundTransaction";

// TODO: ======== STORE SCOPE MODULE ========
import { employeeModule } from "@/modules/employee";
import { roleModule } from "@/modules/role";
import { storeUserModule } from "@/modules/storeUser";

import { orderModule, orderLineModule } from "@/modules/order";

import { partnerDebtAdjustmentModule } from "@/modules/partnerDebtAdjustment";
import { loyaltyPointAdjustmentModule } from "@/modules/loyaltyPointAdjustment";
import { partnerDebtOffsetModule } from "@/modules/partnerDebtOffset";

import {
  inventoryAdjustmentModule,
  inventoryAdjustmentLineModule,
} from "@/modules/inventoryAdjustment";

import { vatDebtAdjustmentModule } from "@/modules/vatDebtAdjustment";

import { incomeExpenseModule } from "@/modules/incomeExpense";

import { inventoryModule } from "@/modules/inventory";
import { partnerDebtModule } from "@/modules/partnerDebt";
import { vatDebtModule } from "@/modules/vatDebt";
import { dashboardModule } from "@/modules/dashboard";
import { excelModule } from "@/modules/excel";
import { loyaltyPointModule } from "@/modules/loyaltyPoint";
import { shiftModule } from "@/modules/shift";

//# ================== Container Setup ====================
const container = new Container();

container.load(
  // TODO: Global Modules
  authModule,
  notificationModule,
  userModule,
  verifyOtpModule,
  storeModule,
  fileModule,
  systemRoleModule,
  attributeModule,

  productModule,
  productOptionModule,
  productVariantModule,

  partnerModule,
  partnerContactModule,
  partnerSubTypeModule,

  storeTransferModule,
  storeTransferLineModule,

  fundModule,
  fundCategoryModule,
  fundAdjustmentModule,
  fundTransferModule,

  fundTransactionModule,

  // TODO: Store Scope Modules
  roleModule,
  employeeModule,
  storeUserModule,

  orderModule,
  orderLineModule,

  partnerDebtAdjustmentModule,
  partnerDebtOffsetModule,

  inventoryAdjustmentModule,
  inventoryAdjustmentLineModule,

  vatDebtAdjustmentModule,

  incomeExpenseModule,

  inventoryModule,
  partnerDebtModule,
  vatDebtModule,

  dashboardModule,

  // Loyalty points
  loyaltyPointModule,
  loyaltyPointAdjustmentModule,

  // Excel module
  excelModule,

  shiftModule,
);

export { container };
