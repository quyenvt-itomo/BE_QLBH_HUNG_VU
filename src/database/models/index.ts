import { Attribute } from "./Attribute";
import { DebtAdjustment } from "./DebtAdjustment";
import { PartnerDebtTransaction } from "./DebtTransaction";
import { File } from "./File";
import { Fund } from "./Fund";
import { FundAdjustment } from "./FundAdjustment";
import { FundTransaction } from "./FundTransaction";
import { FundTransfer } from "./FundTransfer";
import { Notification } from "./Notification";
import { OtpToken } from "./OtpToken";
import { Partner } from "./Partner";
import { PartnerContact } from "./PartnerContact";
import { Product } from "./Product";
import { ProductExtraUnit } from "./ProductExtraUnit";
import { Role } from "./Role";
import { Store } from "./Store";
import { StoreTransfer } from "./StoreTransfer";
import { StoreTransferLine } from "./StoreTransferLine";
import { User } from "./User";
import { VatAdjustment } from "./VatDebtAdjustment";
import { VatTransaction } from "./VatTransaction";
import { IncomeExpense } from "./store/IncomeExpense";
import { InventoryAdjustment } from "./store/InventoryAdjustment";
import { InventoryAdjustmentLine } from "./store/InventoryAdjustmentLine";
import { InventoryTransaction } from "./store/InventoryTransaction";
import { Order } from "./store/Order";
import { OrderLine } from "./store/OrderLine";
import { ProductPriceHistory } from "./store/ProductPriceHistory";
import { StoreProduct } from "./store/StoreProduct";
import { StoreUser } from "./store/StoreUser";

/** Single source of truth for TypeORM entities in the store-scoped model. */
export const entities = [
  Attribute,
  DebtAdjustment,
  PartnerDebtTransaction,
  File,
  Fund,
  FundAdjustment,
  FundTransaction,
  FundTransfer,
  Notification,
  OtpToken,
  Partner,
  PartnerContact,
  Product,
  ProductExtraUnit,
  Role,
  Store,
  StoreTransfer,
  StoreTransferLine,
  User,
  VatAdjustment,
  VatTransaction,
  IncomeExpense,
  InventoryAdjustment,
  InventoryAdjustmentLine,
  InventoryTransaction,
  Order,
  OrderLine,
  ProductPriceHistory,
  StoreProduct,
  StoreUser,
];

export {
  Attribute,
  DebtAdjustment,
  PartnerDebtTransaction,
  File,
  Fund,
  FundAdjustment,
  FundTransaction,
  FundTransfer,
  Notification,
  OtpToken,
  Partner,
  PartnerContact,
  Product,
  ProductExtraUnit,
  Role,
  Store,
  StoreTransfer,
  StoreTransferLine,
  User,
  VatAdjustment,
  VatTransaction,
  IncomeExpense,
  InventoryAdjustment,
  InventoryAdjustmentLine,
  InventoryTransaction,
  Order,
  OrderLine,
  ProductPriceHistory,
  StoreProduct,
  StoreUser,
};
