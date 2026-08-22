import { Container } from "inversify";
import { attributeModule } from "@/module/attribute";
import { authModule } from "@/module/auth";
import { employeeModule } from "@/module/employee";
import { fileModule } from "@/module/file";
import { jobPositionModule } from "@/module/jobPosition";
import { notificationModule } from "@/module/notification";
import { organizationModule } from "@/module/organization";
import { partnerModule } from "@/module/partner";
import { roleModule } from "@/module/role";
import { userModule } from "@/module/user";
import { productModule } from "@/module/product";
import { serviceModule } from "@/module/service";
import { warehouseModule } from "@/module/warehouse";
import { purchaseQuotationModule } from "@/module/purchaseQuotation";
import { quotationRequestModule } from "@/module/quotationRequest";
import { quotationModule } from "@/module/quotation";
import { purchaseModule } from "@/module/purchase";
import { orderModule } from "@/module/order";
import { productionModule } from "@/module/production";
import { stockDocumentModule } from "@/module/stockDocument";
import { inventoryAdjustmentModule } from "@/module/inventoryAdjustment";
import { warehouseTransferModule } from "@/module/warehouseTransfer";
import { gateLogModule } from "@/module/gateLog";
import { shippingPlanModule } from "@/module/shippingPlan";
import { invoiceModule } from "@/module/invoice";
import { paymentRequestModule } from "@/module/paymentRequest";
import { incomeExpenseModule } from "@/module/incomeExpense";
import { fundModule } from "@/module/fund";
import { partnerContactModule } from "@/module/partnerContact";
import { paymentTermModule } from "@/module/paymentTerm";
import { productExtraUnitModule } from "@/module/productExtraUnit";
import { serviceUnitModule } from "@/module/serviceUnit";
import { orderLineModule } from "@/module/orderLine";
import { purchaseLineModule } from "@/module/purchaseLine";
import { quotationLineModule } from "@/module/quotationLine";
import { purchaseQuotationLineModule } from "@/module/purchaseQuotationLine";
import { quotationRequestLineModule } from "@/module/quotationRequestLine";
import { stockDocumentLineModule } from "@/module/stockDocumentLine";
import { inventoryAdjustmentLineModule } from "@/module/inventoryAdjustmentLine";
import { warehouseTransferLineModule } from "@/module/warehouseTransferLine";
import { paymentRequestLineModule } from "@/module/paymentRequestLine";
import { orderCommissionModule } from "@/module/orderCommission";
import { quotationCommissionModule } from "@/module/quotationCommission";
import { fundAdjustmentModule } from "@/module/fundAdjustment";
import { fundTransferModule } from "@/module/fundTransfer";
import { partnerDebtAdjustmentModule } from "@/module/partnerDebtAdjustment";
import { partnerDebtOffsetModule } from "@/module/partnerDebtOffset";
import { commissionDebtAdjustmentModule } from "@/module/commissionDebtAdjustment";
import { partnerDebtSyncModule } from "@/module/partnerDebtSync";
import { vatDebtSyncModule } from "@/module/vatDebtSync";
import { vatDebtAdjustmentModule } from "@/module/vatDebtAdjustment";
import { purchaseRequisitionModule } from "@/module/purchaseRequisition";
import { purchaseRequisitionLineModule } from "@/module/purchaseRequisitionLine";
import { referralCodeModule } from "@/module/referralCode";
import { inventoryConversionModule } from "@/module/inventoryConversion";
import { inventoryConversionLineModule } from "@/module/inventoryConversionLine";
import { billOfMaterialModule } from "@/module/billOfMaterial";
import { inventoryModule } from "@/module/inventory";
import { partnerDebtReportModule } from "@/module/partnerDebtReport";
import { vatDebtReportModule } from "@/module/vatDebtReport";
import { commissionDebtReportModule } from "@/module/commissionDebtReport";
import { fundBalanceReportModule } from "@/module/fundBalanceReport";
import { loginApprovalModule } from "@/module/loginApproval";
import { logModule } from "@/module/log";
import { excelModule } from "@/module/excel/excel.container";

//# ================== Container Setup ====================
const container = new Container();

container.load(
  authModule,
  userModule,
  employeeModule,
  jobPositionModule,
  attributeModule,
  fileModule,
  notificationModule,
  organizationModule,
  roleModule,
  partnerModule,
  productModule,
  serviceModule,
  warehouseModule,
  purchaseQuotationModule,
  quotationRequestModule,
  quotationModule,
  purchaseModule,
  orderModule,
  productionModule,
  stockDocumentModule,
  inventoryAdjustmentModule,
  warehouseTransferModule,
  gateLogModule,
  shippingPlanModule,
  invoiceModule,
  paymentRequestModule,
  incomeExpenseModule,
  fundModule,
  partnerContactModule,
  paymentTermModule,
  productExtraUnitModule,
  serviceUnitModule,
  orderLineModule,
  purchaseLineModule,
  quotationLineModule,
  purchaseQuotationLineModule,
  quotationRequestLineModule,
  stockDocumentLineModule,
  inventoryAdjustmentLineModule,
  warehouseTransferLineModule,
  paymentRequestLineModule,
  orderCommissionModule,
  quotationCommissionModule,
  fundAdjustmentModule,
  fundTransferModule,
  partnerDebtAdjustmentModule,
  partnerDebtOffsetModule,
  partnerDebtSyncModule,
  vatDebtSyncModule,
  commissionDebtAdjustmentModule,
  vatDebtAdjustmentModule,
  purchaseRequisitionModule,
  purchaseRequisitionLineModule,
  referralCodeModule,
  inventoryConversionModule,
  inventoryConversionLineModule,
  billOfMaterialModule,
  partnerDebtReportModule,
  vatDebtReportModule,
  commissionDebtReportModule,
  fundBalanceReportModule,
  loginApprovalModule,
  logModule,
  inventoryModule,
  excelModule,
);

export { container };
