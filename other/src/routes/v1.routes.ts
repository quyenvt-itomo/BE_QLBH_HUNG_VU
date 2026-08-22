import { container } from "@/config/container";
import { ATTRIBUTE_TYPES, AttributeRouter } from "@/modules/attribute";
import { AuthRouter } from "@/modules/auth/auth.route";
import { AUTH_TYPES } from "@/modules/auth/auth.types";
import { EMPLOYEE_TYPES, EmployeeRouter } from "@/modules/employee";
import { FILE_TYPES, FileRouter } from "@/modules/file";
import { FUND_TYPES, FundRouter } from "@/modules/fund";
import {
  FUND_CATEGORY_TYPES,
  FundCategoryRouter,
} from "@/modules/fundCategory";
import {
  FUND_TRANSACTION_TYPES,
  FundTransactionRouter,
} from "@/modules/fundTransaction";
import { INVENTORY_TYPES, InventoryRouter } from "@/modules/inventory";
import {
  INVENTORY_ADJUSTMENT_TYPES,
  InventoryAdjustmentRouter,
} from "@/modules/inventoryAdjustment";
import {
  ORDER_TYPES,
  orderContextMiddleware,
  OrderRouter,
} from "@/modules/order";
import {
  PARTNER_TYPES,
  partnerContextMiddleware,
  PartnerRouter,
} from "@/modules/partner";
import { PRODUCT_TYPES, ProductRouter } from "@/modules/product";
import { ROLE_TYPES, RoleRouter } from "@/modules/role";
import { STORE_TYPES, StoreRouter } from "@/modules/store";
import {
  STORE_TRANSFER_TYPES,
  StoreTransferRouter,
} from "@/modules/storeTransfer";
import { SYSTEM_ROLE_TYPES, SystemRoleRouter } from "@/modules/systemRole";
import { USER_TYPES, UserRouter } from "@/modules/user";
import {
  INCOME_EXPENSE_TYPES,
  IncomeExpenseRouter,
} from "@/modules/incomeExpense";
import {
  authenticate,
  authorization,
} from "@/shared/middleware/auth.middleware";
import { storeResolver } from "@/shared/middleware/store.middleware";
import { getCode } from "@/shared/utils/code.utils";
import { Router } from "express";
import { PARTNER_DEBT_TYPES, PartnerDebtRouter } from "@/modules/partnerDebt";
import { VAT_DEBT_TYPES, VatDebtRouter } from "@/modules/vatDebt";
import { DASHBOARD_TYPES, DashboardRouter } from "@/modules/dashboard";
import { EXCEL_TYPES, ExcelRouter } from "@/modules/excel";
import {
  LOYALTY_POINT_TYPES,
  LoyaltyPointRouter,
} from "@/modules/loyaltyPoint";
import {
  LOYALTY_POINT_ADJUSTMENT_TYPES,
  LoyaltyPointAdjustmentRouter,
} from "@/modules/loyaltyPointAdjustment";
import { SHIFT_TYPES, ShiftRouter } from "@/modules/shift";

const router = Router();
const authRouter = container.get<AuthRouter>(AUTH_TYPES.AuthRouter);

const attributeRouter = container.get<AttributeRouter>(
  ATTRIBUTE_TYPES.AttributeRouter,
);
const storeRouter = container.get<StoreRouter>(STORE_TYPES.StoreRouter);
const userRouter = container.get<UserRouter>(USER_TYPES.UserRouter);
const fileRouter = container.get<FileRouter>(FILE_TYPES.FileRouter);
const systemRoleRouter = container.get<SystemRoleRouter>(
  SYSTEM_ROLE_TYPES.SystemRoleRouter,
);
const productRouter = container.get<ProductRouter>(PRODUCT_TYPES.ProductRouter);
const partnerRouter = container.get<PartnerRouter>(PARTNER_TYPES.PartnerRouter);
const fundRouter = container.get<FundRouter>(FUND_TYPES.FundRouter);
const fundCategoryRouter = container.get<FundCategoryRouter>(
  FUND_CATEGORY_TYPES.FundCategoryRouter,
);
const fundTransactionRouter = container.get<FundTransactionRouter>(
  FUND_TRANSACTION_TYPES.FundTransactionRouter,
);

const roleRouter = container.get<RoleRouter>(ROLE_TYPES.RoleRouter);
const employeeRouter = container.get<EmployeeRouter>(
  EMPLOYEE_TYPES.EmployeeRouter,
);
const orderRouter = container.get<OrderRouter>(ORDER_TYPES.OrderRouter);
const incomeExpenseRouter = container.get<IncomeExpenseRouter>(
  INCOME_EXPENSE_TYPES.IncomeExpenseRouter,
);
const inventoryAdjustmentRouter = container.get<InventoryAdjustmentRouter>(
  INVENTORY_ADJUSTMENT_TYPES.InventoryAdjustmentRouter,
);
const storeTransferRouter = container.get<StoreTransferRouter>(
  STORE_TRANSFER_TYPES.StoreTransferRouter,
);

const inventoryRouter = container.get<InventoryRouter>(
  INVENTORY_TYPES.InventoryRouter,
);
const partnerDebtRouter = container.get<PartnerDebtRouter>(
  PARTNER_DEBT_TYPES.PartnerDebtRouter,
);
const vatDebtRouter = container.get<VatDebtRouter>(
  VAT_DEBT_TYPES.VatDebtRouter,
);
const dashboardRouter = container.get<DashboardRouter>(
  DASHBOARD_TYPES.DashboardRouter,
);
const excelRouter = container.get<ExcelRouter>(EXCEL_TYPES.ExcelRouter);
const loyaltyPointRouter = container.get<LoyaltyPointRouter>(
  LOYALTY_POINT_TYPES.LoyaltyPointRouter,
);
const loyaltyPointAdjustmentRouter =
  container.get<LoyaltyPointAdjustmentRouter>(
    LOYALTY_POINT_ADJUSTMENT_TYPES.LoyaltyPointAdjustmentRouter,
  );
const shiftRouter = container.get<ShiftRouter>(SHIFT_TYPES.ShiftRouter);

router.use("/auth", authRouter.getRouter());

router.use(authenticate); // Apply authentication middleware to all routes below
router.use(authorization); // Apply admin middleware to all routes below
router.use(storeResolver); // Apply store resolver middleware to all routes below

router.use("/attribute", attributeRouter.getRouter());
router.use("/system-role", systemRoleRouter.getRouter());
router.use("/store", storeRouter.getRouter());
router.use("/user", userRouter.getRouter());
router.use("/file", fileRouter.getRouter());
router.use("/product", productRouter.getRouter());
router.use(
  "/customer",
  partnerContextMiddleware("customer"),
  partnerRouter.getRouter(),
);
router.use(
  "/supplier",
  partnerContextMiddleware("supplier"),
  partnerRouter.getRouter(),
);
router.use("/partner", partnerRouter.getByRoleRouter());
router.use("/fund", fundRouter.getRouter());
router.use("/fund-category", fundCategoryRouter.getRouter());
router.use("/fund-balance", fundTransactionRouter.getRouter());

router.use("/role", roleRouter.getRouter());
router.use("/employee", employeeRouter.getRouter());
router.use(
  "/purchase-order",
  orderContextMiddleware("purchaseOrder"),
  orderRouter.getRouter(),
);
router.use(
  "/sale-order",
  orderContextMiddleware("saleOrder"),
  orderRouter.getRouter(),
);
router.use(
  "/purchase-return",
  orderContextMiddleware("purchaseReturn"),
  orderRouter.getRouter(),
);
router.use(
  "/sale-return",
  orderContextMiddleware("saleReturn"),
  orderRouter.getRouter(),
);
router.use("/income-expense", incomeExpenseRouter.getRouter());
router.use("/inventory-adjustment", inventoryAdjustmentRouter.getRouter());
router.use("/store-transfer", storeTransferRouter.getRouter());
router.use("/inventory", inventoryRouter.getRouter());
router.use("/partner-debt", partnerDebtRouter.getRouter());
router.use("/vat-debt", vatDebtRouter.getRouter());
router.use("/loyalty-point", loyaltyPointRouter.getRouter());
router.use(
  "/loyalty-point-adjustment",
  loyaltyPointAdjustmentRouter.getRouter(),
);
router.use("/dashboard", dashboardRouter.getRouter());
router.use("/excel", excelRouter.getRouter());
router.use("/shift", shiftRouter.getRouter());
router.use("/code", getCode);

export default router;
