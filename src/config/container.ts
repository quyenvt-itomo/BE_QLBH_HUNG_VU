import { Container } from "inversify";
import DatabaseConfig from "./database";
import { TYPES } from "@/shared/types/container.types";
import { attributeModule } from "@/module/attribute";
import { authModule } from "@/module/auth";
import { debtAdjustmentModule } from "@/module/debtAdjustment";
import { fileModule } from "@/module/file";
import { fundModule } from "@/module/fund";
import { fundAdjustmentModule } from "@/module/fundAdjustment";
import { fundTransactionModule } from "@/module/fundTransaction";
import { fundTransferModule } from "@/module/fundTransfer";
import { incomeExpenseModule } from "@/module/incomeExpense";
import { inventoryModule } from "@/module/inventory";
import { inventoryAdjustmentModule } from "@/module/inventoryAdjustment";
import { inventoryTransactionModule } from "@/module/inventoryTransaction";
import { notificationModule } from "@/module/notification";
import { orderModule } from "@/module/order";
import { otpTokenModule } from "@/module/otpToken";
import { partnerModule } from "@/module/partner";
import { partnerContactModule } from "@/module/partnerContact";
import { productModule } from "@/module/product";
import { productExtraUnitModule } from "@/module/productExtraUnit";
import { productPriceHistoryModule } from "@/module/productPriceHistory";
import { roleModule } from "@/module/role";
import { storeModule } from "@/module/store";
import { storeProductModule } from "@/module/storeProduct";
import { storeTransferModule } from "@/module/storeTransfer";
import { storeUserModule } from "@/module/storeUser";
import { userModule } from "@/module/user";
import { vatAdjustmentModule } from "@/module/vatDebtAdjustment";
import { vatTransactionModule } from "@/module/vatTransaction";

// ================== Container Setup ====================
export const container = new Container();

container.bind(TYPES.DataSource).toConstantValue(DatabaseConfig);

container.load(
  authModule,
  attributeModule,
  fileModule,
  notificationModule,
  otpTokenModule,
  userModule,
  roleModule,
  storeModule,
  partnerModule,
  partnerContactModule,
  productModule,
  productExtraUnitModule,
  orderModule,
  inventoryModule,
  inventoryAdjustmentModule,
  inventoryTransactionModule,
  storeTransferModule,
  productPriceHistoryModule,
  fundModule,
  fundAdjustmentModule,
  fundTransactionModule,
  fundTransferModule,
  incomeExpenseModule,
  debtAdjustmentModule,
  vatAdjustmentModule,
  vatTransactionModule,
  storeProductModule,
  storeUserModule,
);
