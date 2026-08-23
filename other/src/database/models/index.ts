import { Attribute } from "./Attribute";
import { Notification } from "./Notification";
import { Token } from "./Token";
import { User } from "./User";
import { UserNotification } from "./UserNotification";
import { VerifyOtp } from "./VerifyOtp";
import { File } from "./File";
import { Store } from "./Store";
import { SystemRole } from "./SystemRole";
import { Product } from "./Product";
import { ProductOption } from "./ProductOption";
import { ProductVariant } from "./ProductVariant";
import { Partner } from "./Partner";
import { PartnerContact } from "./PartnerContact";
import { PartnerSubType } from "./PartnerSubType";

import { Role } from "./store/Role";
import { Employee } from "./store/Employee";
import { StoreUser } from "./store/StoreUser";
import { Order } from "./store/Order";
import { OrderLine } from "./store/OrderLine";
import { StoreTransfer } from "./StoreTransfer";
import { StoreTransferLine } from "./StoreTransferLine";
import { InventoryAdjustment } from "./store/InventoryAdjustment";
import { InventoryTransaction } from "./store/InventoryTransaction";
import { InventoryAdjustmentLine } from "./store/InventoryAdjustmentLine";
import { Fund } from "./Fund";
import { FundCategory } from "./FundCategory";
import { IncomeExpense } from "./store/IncomeExpense";
import { FundAdjustment } from "./FundAdjustment";
import { FundTransfer } from "./FundTransfer";
import { FundTransaction } from "./FundTransaction";
import { FundSnapshot } from "./FundSnapshot";
import { PartnerDebtAdjustment } from "./store/PartnerDebtAdjustment";
import { PartnerDebtOffset } from "./store/PartnerDebtOffset";
import { DebtTransaction } from "./store/DebtTransaction";
import { PartnerDebtSnapshot } from "./store/PartnerDebtSnapshot";
import { VatDebtTransaction } from "./store/VatDebtTransaction";
import { VatDebtSnapshot } from "./store/VatDebtSnapshot";
import { VatDebtAdjustment } from "./store/VatDebtAdjustment";
import { LoyaltyPointTransaction } from "./LoyaltyPointTransaction";
import { LoyaltyPointSnapshot } from "./LoyaltyPointSnapshot";
import { LoyaltyPointAdjustment } from "./LoyaltyPointAdjustment";
import { Shift } from "./store/Shift";

export const entities = [
  // Systems
  User,
  Notification,
  UserNotification,
  Attribute,
  Store,
  SystemRole,
  File,
  Token,
  VerifyOtp,

  Product,
  ProductOption,
  ProductVariant,

  Partner,
  PartnerContact,
  PartnerSubType,

  StoreTransfer,
  StoreTransferLine,

  // Store related
  Role,
  Employee,
  StoreUser,

  Order,
  OrderLine,
  InventoryAdjustment,
  InventoryAdjustmentLine,

  InventoryTransaction,

  Fund,
  FundCategory,

  IncomeExpense,
  FundAdjustment,
  FundTransfer,

  FundTransaction,
  FundSnapshot,

  PartnerDebtAdjustment,
  PartnerDebtOffset,

  DebtTransaction,
  PartnerDebtSnapshot,

  VatDebtAdjustment,

  VatDebtTransaction,
  VatDebtSnapshot,

  LoyaltyPointTransaction,
  LoyaltyPointSnapshot,

  LoyaltyPointAdjustment,

  Shift,
];
