import { container } from "@/config/container";
import { ATTRIBUTE_TYPES, AttributeRouter } from "@/module/attribute";
import { AuthRouter, AUTH_TYPES } from "@/module/auth";
import { EMPLOYEE_TYPES, EmployeeRouter } from "@/module/employee";
import { FILE_TYPES, FileRouter } from "@/module/file";
import { JOB_POSITION_TYPES, JobPositionRouter } from "@/module/jobPosition";
import { ORGANIZATION_TYPES, OrganizationRouter } from "@/module/organization";
import { ROLE_TYPES, RoleRouter } from "@/module/role";
import { USER_TYPES, UserRouter } from "@/module/user";
import { PARTNER_TYPES, PartnerRouter } from "@/module/partner";
import { PRODUCT_TYPES, ProductRouter } from "@/module/product";
import { SERVICE_TYPES, ServiceRouter } from "@/module/service";
import { WAREHOUSE_TYPES, WarehouseRouter } from "@/module/warehouse";
import {
  PURCHASE_QUOTATION_TYPES,
  PurchaseQuotationRouter,
} from "@/module/purchaseQuotation";
import {
  QUOTATION_REQUEST_TYPES,
  QuotationRequestRouter,
} from "@/module/quotationRequest";
import { QUOTATION_TYPES, QuotationRouter } from "@/module/quotation";
import { PURCHASE_TYPES, PurchaseRouter } from "@/module/purchase";
import { ORDER_TYPES, OrderRouter } from "@/module/order";
import { PRODUCTION_TYPES, ProductionRouter } from "@/module/production";
import {
  STOCK_DOCUMENT_TYPES,
  StockDocumentRouter,
} from "@/module/stockDocument";
import {
  INVENTORY_ADJUSTMENT_TYPES,
  InventoryAdjustmentRouter,
} from "@/module/inventoryAdjustment";
import {
  WAREHOUSE_TRANSFER_TYPES,
  WarehouseTransferRouter,
} from "@/module/warehouseTransfer";
import { GATE_LOG_TYPES, GateLogRouter } from "@/module/gateLog";
import { SHIPPING_PLAN_TYPES, ShippingPlanRouter } from "@/module/shippingPlan";
import { INVOICE_TYPES, InvoiceRouter } from "@/module/invoice";
import {
  PAYMENT_REQUEST_TYPES,
  PaymentRequestRouter,
} from "@/module/paymentRequest";
import {
  INCOME_EXPENSE_TYPES,
  IncomeExpenseRouter,
} from "@/module/incomeExpense";
import { FUND_TYPES, FundRouter } from "@/module/fund";
import {
  PARTNER_CONTACT_TYPES,
  PartnerContactRouter,
} from "@/module/partnerContact";
import { PAYMENT_TERM_TYPES, PaymentTermRouter } from "@/module/paymentTerm";
import {
  PRODUCT_EXTRA_UNIT_TYPES,
  ProductExtraUnitRouter,
} from "@/module/productExtraUnit";
import { SERVICE_UNIT_TYPES, ServiceUnitRouter } from "@/module/serviceUnit";
import { ORDER_LINE_TYPES, OrderLineRouter } from "@/module/orderLine";
import { PURCHASE_LINE_TYPES, PurchaseLineRouter } from "@/module/purchaseLine";
import {
  QUOTATION_LINE_TYPES,
  QuotationLineRouter,
} from "@/module/quotationLine";
import {
  PURCHASE_QUOTATION_LINE_TYPES,
  PurchaseQuotationLineRouter,
} from "@/module/purchaseQuotationLine";
import {
  QUOTATION_REQUEST_LINE_TYPES,
  QuotationRequestLineRouter,
} from "@/module/quotationRequestLine";
import {
  STOCK_DOCUMENT_LINE_TYPES,
  StockDocumentLineRouter,
} from "@/module/stockDocumentLine";
import {
  INVENTORY_ADJUSTMENT_LINE_TYPES,
  InventoryAdjustmentLineRouter,
} from "@/module/inventoryAdjustmentLine";
import {
  WAREHOUSE_TRANSFER_LINE_TYPES,
  WarehouseTransferLineRouter,
} from "@/module/warehouseTransferLine";
import {
  PAYMENT_REQUEST_LINE_TYPES,
  PaymentRequestLineRouter,
} from "@/module/paymentRequestLine";
import {
  ORDER_COMMISSION_TYPES,
  OrderCommissionRouter,
} from "@/module/orderCommission";
import {
  QUOTATION_COMMISSION_TYPES,
  QuotationCommissionRouter,
} from "@/module/quotationCommission";
import {
  FUND_ADJUSTMENT_TYPES,
  FundAdjustmentRouter,
} from "@/module/fundAdjustment";
import { FUND_TRANSFER_TYPES, FundTransferRouter } from "@/module/fundTransfer";
import {
  PARTNER_DEBT_ADJUSTMENT_TYPES,
  PartnerDebtAdjustmentRouter,
} from "@/module/partnerDebtAdjustment";
import {
  PARTNER_DEBT_OFFSET_TYPES,
  PartnerDebtOffsetRouter,
} from "@/module/partnerDebtOffset";
import {
  COMMISSION_DEBT_ADJUSTMENT_TYPES,
  CommissionDebtAdjustmentRouter,
} from "@/module/commissionDebtAdjustment";
import {
  VAT_DEBT_ADJUSTMENT_TYPES,
  VatDebtAdjustmentRouter,
} from "@/module/vatDebtAdjustment";
import {
  PURCHASE_REQUISITION_TYPES,
  PurchaseRequisitionRouter,
} from "@/module/purchaseRequisition";
import {
  PURCHASE_REQUISITION_LINE_TYPES,
  PurchaseRequisitionLineRouter,
} from "@/module/purchaseRequisitionLine";
import { REFERRAL_CODE_TYPES, ReferralCodeRouter } from "@/module/referralCode";
import {
  INVENTORY_CONVERSION_TYPES,
  InventoryConversionRouter,
} from "@/module/inventoryConversion";
import {
  INVENTORY_CONVERSION_LINE_TYPES,
  InventoryConversionLineRouter,
} from "@/module/inventoryConversionLine";
import {
  BILL_OF_MATERIAL_TYPES,
  BillOfMaterialRouter,
} from "@/module/billOfMaterial";
import { INVENTORY_TYPES, InventoryRouter } from "@/module/inventory";
import {
  PARTNER_DEBT_REPORT_TYPES,
  PartnerDebtReportRouter,
} from "@/module/partnerDebtReport";
import {
  VAT_DEBT_REPORT_TYPES,
  VatDebtReportRouter,
} from "@/module/vatDebtReport";
import {
  COMMISSION_DEBT_REPORT_TYPES,
  CommissionDebtReportRouter,
} from "@/module/commissionDebtReport";
import {
  FUND_BALANCE_REPORT_TYPES,
  FundBalanceReportRouter,
} from "@/module/fundBalanceReport";
import {
  LOGIN_APPROVAL_TYPES,
  LoginApprovalRouter,
} from "@/module/loginApproval";
import {
  authenticate,
  authorization,
} from "@/shared/middleware/auth.middleware";
import { companyResolver } from "@/shared/middleware/company.middleware";
import { injectRequestContext } from "@/shared/middleware/requestContext.middleware";
import { getCode } from "@/shared/utils/code.utils";
import { Router } from "express";
import { EXCEL_TYPES, ExcelRouter } from "@/module/excel";
import { LOG_TYPES, LogRouter } from "@/module/log";

const router = Router();

const logRouter = container.get<LogRouter>(LOG_TYPES.LogRouter);
const excelRouter = container.get<ExcelRouter>(EXCEL_TYPES.ExcelRouter);
const authRouter = container.get<AuthRouter>(AUTH_TYPES.AuthRouter);
const userRouter = container.get<UserRouter>(USER_TYPES.UserRouter);
const attributeRouter = container.get<AttributeRouter>(
  ATTRIBUTE_TYPES.AttributeRouter,
);
const fileRouter = container.get<FileRouter>(FILE_TYPES.FileRouter);
const roleRouter = container.get<RoleRouter>(ROLE_TYPES.RoleRouter);
const employeeRouter = container.get<EmployeeRouter>(
  EMPLOYEE_TYPES.EmployeeRouter,
);
const jobPositionRouter = container.get<JobPositionRouter>(
  JOB_POSITION_TYPES.JobPositionRouter,
);
const organizationRouter = container.get<OrganizationRouter>(
  ORGANIZATION_TYPES.OrganizationRouter,
);
const partnerRouter = container.get<PartnerRouter>(PARTNER_TYPES.PartnerRouter);
const productRouter = container.get<ProductRouter>(PRODUCT_TYPES.ProductRouter);
const serviceRouter = container.get<ServiceRouter>(SERVICE_TYPES.ServiceRouter);
const warehouseRouter = container.get<WarehouseRouter>(
  WAREHOUSE_TYPES.WarehouseRouter,
);
const purchaseQuotationRouter = container.get<PurchaseQuotationRouter>(
  PURCHASE_QUOTATION_TYPES.PurchaseQuotationRouter,
);
const quotationRequestRouter = container.get<QuotationRequestRouter>(
  QUOTATION_REQUEST_TYPES.QuotationRequestRouter,
);
const quotationRouter = container.get<QuotationRouter>(
  QUOTATION_TYPES.QuotationRouter,
);
const purchaseRouter = container.get<PurchaseRouter>(
  PURCHASE_TYPES.PurchaseRouter,
);
const orderRouter = container.get<OrderRouter>(ORDER_TYPES.OrderRouter);
const productionRouter = container.get<ProductionRouter>(
  PRODUCTION_TYPES.ProductionRouter,
);
const stockDocumentRouter = container.get<StockDocumentRouter>(
  STOCK_DOCUMENT_TYPES.StockDocumentRouter,
);
const inventoryAdjustmentRouter = container.get<InventoryAdjustmentRouter>(
  INVENTORY_ADJUSTMENT_TYPES.InventoryAdjustmentRouter,
);
const warehouseTransferRouter = container.get<WarehouseTransferRouter>(
  WAREHOUSE_TRANSFER_TYPES.WarehouseTransferRouter,
);
const gateLogRouter = container.get<GateLogRouter>(
  GATE_LOG_TYPES.GateLogRouter,
);
const shippingPlanRouter = container.get<ShippingPlanRouter>(
  SHIPPING_PLAN_TYPES.ShippingPlanRouter,
);
const invoiceRouter = container.get<InvoiceRouter>(INVOICE_TYPES.InvoiceRouter);
const paymentRequestRouter = container.get<PaymentRequestRouter>(
  PAYMENT_REQUEST_TYPES.PaymentRequestRouter,
);
const incomeExpenseRouter = container.get<IncomeExpenseRouter>(
  INCOME_EXPENSE_TYPES.IncomeExpenseRouter,
);
const fundRouter = container.get<FundRouter>(FUND_TYPES.FundRouter);
const partnerContactRouter = container.get<PartnerContactRouter>(
  PARTNER_CONTACT_TYPES.PartnerContactRouter,
);
const paymentTermRouter = container.get<PaymentTermRouter>(
  PAYMENT_TERM_TYPES.PaymentTermRouter,
);
const productExtraUnitRouter = container.get<ProductExtraUnitRouter>(
  PRODUCT_EXTRA_UNIT_TYPES.ProductExtraUnitRouter,
);
const serviceUnitRouter = container.get<ServiceUnitRouter>(
  SERVICE_UNIT_TYPES.ServiceUnitRouter,
);
const orderLineRouter = container.get<OrderLineRouter>(
  ORDER_LINE_TYPES.OrderLineRouter,
);
const purchaseLineRouter = container.get<PurchaseLineRouter>(
  PURCHASE_LINE_TYPES.PurchaseLineRouter,
);
const quotationLineRouter = container.get<QuotationLineRouter>(
  QUOTATION_LINE_TYPES.QuotationLineRouter,
);
const purchaseQuotationLineRouter = container.get<PurchaseQuotationLineRouter>(
  PURCHASE_QUOTATION_LINE_TYPES.PurchaseQuotationLineRouter,
);
const quotationRequestLineRouter = container.get<QuotationRequestLineRouter>(
  QUOTATION_REQUEST_LINE_TYPES.QuotationRequestLineRouter,
);
const stockDocumentLineRouter = container.get<StockDocumentLineRouter>(
  STOCK_DOCUMENT_LINE_TYPES.StockDocumentLineRouter,
);
const inventoryAdjustmentLineRouter =
  container.get<InventoryAdjustmentLineRouter>(
    INVENTORY_ADJUSTMENT_LINE_TYPES.InventoryAdjustmentLineRouter,
  );
const warehouseTransferLineRouter = container.get<WarehouseTransferLineRouter>(
  WAREHOUSE_TRANSFER_LINE_TYPES.WarehouseTransferLineRouter,
);
const paymentRequestLineRouter = container.get<PaymentRequestLineRouter>(
  PAYMENT_REQUEST_LINE_TYPES.PaymentRequestLineRouter,
);
const orderCommissionRouter = container.get<OrderCommissionRouter>(
  ORDER_COMMISSION_TYPES.OrderCommissionRouter,
);
const quotationCommissionRouter = container.get<QuotationCommissionRouter>(
  QUOTATION_COMMISSION_TYPES.QuotationCommissionRouter,
);
const fundAdjustmentRouter = container.get<FundAdjustmentRouter>(
  FUND_ADJUSTMENT_TYPES.FundAdjustmentRouter,
);
const fundTransferRouter = container.get<FundTransferRouter>(
  FUND_TRANSFER_TYPES.FundTransferRouter,
);
const partnerDebtAdjustmentRouter = container.get<PartnerDebtAdjustmentRouter>(
  PARTNER_DEBT_ADJUSTMENT_TYPES.PartnerDebtAdjustmentRouter,
);
const partnerDebtOffsetRouter = container.get<PartnerDebtOffsetRouter>(
  PARTNER_DEBT_OFFSET_TYPES.PartnerDebtOffsetRouter,
);
const commissionDebtAdjustmentRouter =
  container.get<CommissionDebtAdjustmentRouter>(
    COMMISSION_DEBT_ADJUSTMENT_TYPES.CommissionDebtAdjustmentRouter,
  );
const vatDebtAdjustmentRouter = container.get<VatDebtAdjustmentRouter>(
  VAT_DEBT_ADJUSTMENT_TYPES.VatDebtAdjustmentRouter,
);
const purchaseRequisitionRouter = container.get<PurchaseRequisitionRouter>(
  PURCHASE_REQUISITION_TYPES.PurchaseRequisitionRouter,
);
const purchaseRequisitionLineRouter =
  container.get<PurchaseRequisitionLineRouter>(
    PURCHASE_REQUISITION_LINE_TYPES.PurchaseRequisitionLineRouter,
  );
const referralCodeRouter = container.get<ReferralCodeRouter>(
  REFERRAL_CODE_TYPES.ReferralCodeRouter,
);
const inventoryConversionRouter = container.get<InventoryConversionRouter>(
  INVENTORY_CONVERSION_TYPES.InventoryConversionRouter,
);
const inventoryConversionLineRouter =
  container.get<InventoryConversionLineRouter>(
    INVENTORY_CONVERSION_LINE_TYPES.InventoryConversionLineRouter,
  );
const billOfMaterialRouter = container.get<BillOfMaterialRouter>(
  BILL_OF_MATERIAL_TYPES.BillOfMaterialRouter,
);
const inventoryRouter = container.get<InventoryRouter>(
  INVENTORY_TYPES.InventoryRouter,
);
const partnerDebtReportRouter = container.get<PartnerDebtReportRouter>(
  PARTNER_DEBT_REPORT_TYPES.PartnerDebtReportRouter,
);
const vatDebtReportRouter = container.get<VatDebtReportRouter>(
  VAT_DEBT_REPORT_TYPES.VatDebtReportRouter,
);
const commissionDebtReportRouter = container.get<CommissionDebtReportRouter>(
  COMMISSION_DEBT_REPORT_TYPES.CommissionDebtReportRouter,
);
const fundBalanceReportRouter = container.get<FundBalanceReportRouter>(
  FUND_BALANCE_REPORT_TYPES.FundBalanceReportRouter,
);
const loginApprovalRouter = container.get<LoginApprovalRouter>(
  LOGIN_APPROVAL_TYPES.LoginApprovalRouter,
);

router.use("/auth", authRouter.getRouter());
router.use("/public/product", productRouter.getPublicRouter());
router.use("/public/partner", partnerRouter.getPublicRouter());
router.use("/public/organization", organizationRouter.getPublicRouter());
router.use("/public/referral-code", referralCodeRouter.getPublicRouter());
router.use(
  "/public/purchase-quotation",
  purchaseQuotationRouter.getPublicRouter(),
);
router.use(
  "/public/quotation-request",
  quotationRequestRouter.getPublicRouter(),
);

router.use(authenticate); // Apply authentication middleware to all routes below
router.use(companyResolver); // Resolve company context for all routes below
router.use(authorization); // Apply admin middleware to all routes below
router.use(injectRequestContext); // ⚠️ Phải nằm SAU authorization (cần req.userContext)

router.use("/log", logRouter.getRouter());
router.use("/excel", excelRouter.getRouter());
router.use("/user", userRouter.getRouter());
router.use("/attribute", attributeRouter.getRouter());
router.use("/file", fileRouter.getRouter());
router.use("/role", roleRouter.getRouter());
router.use("/employee", employeeRouter.getRouter());
router.use("/job-position", jobPositionRouter.getRouter());
router.use("/organization", organizationRouter.getRouter());
router.use("/partner", partnerRouter.getRouter());
router.use("/product", productRouter.getRouter());
router.use("/service", serviceRouter.getRouter());
router.use("/warehouse", warehouseRouter.getRouter());
router.use("/purchase-quotation", purchaseQuotationRouter.getRouter());
router.use("/quotation-request", quotationRequestRouter.getRouter());
router.use("/quotation", quotationRouter.getRouter());
router.use("/purchase", purchaseRouter.getRouter());
router.use("/order", orderRouter.getRouter());
router.use("/production", productionRouter.getRouter());
router.use("/stock-document", stockDocumentRouter.getRouter());
router.use("/inventory-adjustment", inventoryAdjustmentRouter.getRouter());
router.use("/warehouse-transfer", warehouseTransferRouter.getRouter());
router.use("/gate-log", gateLogRouter.getRouter());
router.use("/shipping-plan", shippingPlanRouter.getRouter());
router.use("/invoice", invoiceRouter.getRouter());
router.use("/payment-request", paymentRequestRouter.getRouter());
router.use("/income-expense", incomeExpenseRouter.getRouter());
router.use("/fund", fundRouter.getRouter());
router.use("/partner-contact", partnerContactRouter.getRouter());
router.use("/payment-term", paymentTermRouter.getRouter());
router.use("/product-extra-unit", productExtraUnitRouter.getRouter());
router.use("/service-unit", serviceUnitRouter.getRouter());
router.use("/order-line", orderLineRouter.getRouter());
router.use("/purchase-line", purchaseLineRouter.getRouter());
router.use("/quotation-line", quotationLineRouter.getRouter());
router.use("/purchase-quotation-line", purchaseQuotationLineRouter.getRouter());
router.use("/quotation-request-line", quotationRequestLineRouter.getRouter());
router.use("/stock-document-line", stockDocumentLineRouter.getRouter());
router.use(
  "/inventory-adjustment-line",
  inventoryAdjustmentLineRouter.getRouter(),
);
router.use("/warehouse-transfer-line", warehouseTransferLineRouter.getRouter());
router.use("/payment-request-line", paymentRequestLineRouter.getRouter());
router.use("/order-commission", orderCommissionRouter.getRouter());
router.use("/quotation-commission", quotationCommissionRouter.getRouter());
router.use("/fund-adjustment", fundAdjustmentRouter.getRouter());
router.use("/fund-transfer", fundTransferRouter.getRouter());
router.use("/partner-debt-adjustment", partnerDebtAdjustmentRouter.getRouter());
router.use("/partner-debt-offset", partnerDebtOffsetRouter.getRouter());
router.use(
  "/commission-debt-adjustment",
  commissionDebtAdjustmentRouter.getRouter(),
);
router.use("/vat-debt-adjustment", vatDebtAdjustmentRouter.getRouter());
router.use("/purchase-requisition", purchaseRequisitionRouter.getRouter());
router.use(
  "/purchase-requisition-line",
  purchaseRequisitionLineRouter.getRouter(),
);
router.use("/referral-code", referralCodeRouter.getRouter());
// Public route: giải mã mã giới thiệu (không cần auth)
router.use("/referral-code/public", referralCodeRouter.getPublicRouter());
router.use("/inventory-conversion", inventoryConversionRouter.getRouter());
router.use(
  "/inventory-conversion-line",
  inventoryConversionLineRouter.getRouter(),
);
router.use("/bill-of-material", billOfMaterialRouter.getRouter());
router.use("/inventory", inventoryRouter.getRouter());
router.use("/partner-debt", partnerDebtReportRouter.getRouter());
router.use("/vat-debt", vatDebtReportRouter.getRouter());
router.use("/commission-debt", commissionDebtReportRouter.getRouter());
router.use("/fund-balance", fundBalanceReportRouter.getRouter());
router.use("/login-approval", loginApprovalRouter.getRouter());
router.use("/code", getCode);

export default router;
