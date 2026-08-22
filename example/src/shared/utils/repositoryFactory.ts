import { container } from "@/config/container";
import { ATTRIBUTE_TYPES } from "@/module/attribute/attribute.types";
import { BILL_OF_MATERIAL_TYPES } from "@/module/billOfMaterial/billOfMaterial.types";
import { COMMISSION_DEBT_ADJUSTMENT_TYPES } from "@/module/commissionDebtAdjustment/commissionDebtAdjustment.types";
import { EMPLOYEE_TYPES } from "@/module/employee/employee.types";
import { FUND_TYPES } from "@/module/fund/fund.types";
import { FUND_ADJUSTMENT_TYPES } from "@/module/fundAdjustment/fundAdjustment.types";
import { FUND_TRANSFER_TYPES } from "@/module/fundTransfer/fundTransfer.types";
import { GATE_LOG_TYPES } from "@/module/gateLog/gateLog.types";
import { INCOME_EXPENSE_TYPES } from "@/module/incomeExpense/incomeExpense.types";
import { INVENTORY_ADJUSTMENT_TYPES } from "@/module/inventoryAdjustment/inventoryAdjustment.types";
import { INVENTORY_CONVERSION_TYPES } from "@/module/inventoryConversion/inventoryConversion.types";
import { INVOICE_TYPES } from "@/module/invoice/invoice.types";
import { JOB_POSITION_TYPES } from "@/module/jobPosition/jobPosition.types";
import { ORDER_TYPES } from "@/module/order/order.types";
import { ORGANIZATION_TYPES } from "@/module/organization/organization.types";
import { PARTNER_TYPES } from "@/module/partner/partner.types";
import { PARTNER_CONTACT_TYPES } from "@/module/partnerContact/partnerContact.types";
import { PAYMENT_REQUEST_TYPES } from "@/module/paymentRequest/paymentRequest.types";
import { PAYMENT_TERM_TYPES } from "@/module/paymentTerm/paymentTerm.types";
import { PRODUCT_TYPES } from "@/module/product/product.types";
import { PRODUCTION_TYPES } from "@/module/production/production.types";
import { PURCHASE_TYPES } from "@/module/purchase/purchase.types";
import { PURCHASE_LINE_TYPES } from "@/module/purchaseLine/purchaseLine.types";
import { PURCHASE_QUOTATION_TYPES } from "@/module/purchaseQuotation/purchaseQuotation.types";
import { PURCHASE_REQUISITION_TYPES } from "@/module/purchaseRequisition/purchaseRequisition.types";
import { QUOTATION_TYPES } from "@/module/quotation/quotation.types";
import { QUOTATION_REQUEST_TYPES } from "@/module/quotationRequest/quotationRequest.types";
import { REFERRAL_CODE_TYPES } from "@/module/referralCode/referralCode.types";
import { ROLE_TYPES } from "@/module/role/role.types";
import { SERVICE_TYPES } from "@/module/service/service.types";
import { SHIPPING_PLAN_TYPES } from "@/module/shippingPlan/shippingPlan.types";
import { STOCK_DOCUMENT_TYPES } from "@/module/stockDocument/stockDocument.types";
import { USER_TYPES } from "@/module/user/user.types";
import { WAREHOUSE_TYPES } from "@/module/warehouse/warehouse.types";
import { WAREHOUSE_TRANSFER_TYPES } from "@/module/warehouseTransfer/warehouseTransfer.types";
import { PARTNER_DEBT_ADJUSTMENT_TYPES } from "@/module/partnerDebtAdjustment/partnerDebtAdjustment.types";
import { PARTNER_DEBT_OFFSET_TYPES } from "@/module/partnerDebtOffset/partnerDebtOffset.types";
import { VAT_DEBT_ADJUSTMENT_TYPES } from "@/module/vatDebtAdjustment/vatDebtAdjustment.types";

/**
 * Factory để tạo repository map cho tenant entities
 * Tự động lấy tất cả repositories từ inversify container
 */
export class RepositoryFactory {
  private static repoMap: Record<string, any> | null = null;

  /**
   * Lấy tất cả tenant repositories
   * Map entity name -> repository instance
   */
  static getRepositories(): Record<string, any> {
    // Cache lại để không phải get nhiều lần
    if (this.repoMap) {
      return this.repoMap;
    }

    this.repoMap = {
      Attribute: container.get(ATTRIBUTE_TYPES.AttributeRepository),
      BillOfMaterial: container.get(
        BILL_OF_MATERIAL_TYPES.BillOfMaterialRepository,
      ),
      CommissionDebtAdjustment: container.get(
        COMMISSION_DEBT_ADJUSTMENT_TYPES.CommissionDebtAdjustmentRepository,
      ),
      Employee: container.get(EMPLOYEE_TYPES.EmployeeRepository),
      Fund: container.get(FUND_TYPES.FundRepository),
      FundAdjustment: container.get(
        FUND_ADJUSTMENT_TYPES.FundAdjustmentRepository,
      ),
      FundTransfer: container.get(FUND_TRANSFER_TYPES.FundTransferRepository),
      GateLog: container.get(GATE_LOG_TYPES.GateLogRepository),
      IncomeExpense: container.get(
        INCOME_EXPENSE_TYPES.IncomeExpenseRepository,
      ),
      InventoryAdjustment: container.get(
        INVENTORY_ADJUSTMENT_TYPES.InventoryAdjustmentRepository,
      ),
      InventoryConversion: container.get(
        INVENTORY_CONVERSION_TYPES.InventoryConversionRepository,
      ),
      Invoice: container.get(INVOICE_TYPES.InvoiceRepository),
      JobPosition: container.get(JOB_POSITION_TYPES.JobPositionRepository),
      Order: container.get(ORDER_TYPES.OrderRepository),
      Organization: container.get(ORGANIZATION_TYPES.OrganizationRepository),
      Partner: container.get(PARTNER_TYPES.PartnerRepository),
      PartnerContact: container.get(
        PARTNER_CONTACT_TYPES.PartnerContactRepository,
      ),
      PaymentRequest: container.get(
        PAYMENT_REQUEST_TYPES.PaymentRequestRepository,
      ),
      PaymentTerm: container.get(PAYMENT_TERM_TYPES.PaymentTermRepository),
      Product: container.get(PRODUCT_TYPES.ProductRepository),
      Production: container.get(PRODUCTION_TYPES.ProductionRepository),
      Purchase: container.get(PURCHASE_TYPES.PurchaseRepository),
      PurchaseLine: container.get(PURCHASE_LINE_TYPES.PurchaseLineRepository),
      PurchaseQuotation: container.get(
        PURCHASE_QUOTATION_TYPES.PurchaseQuotationRepository,
      ),
      PurchaseRequisition: container.get(
        PURCHASE_REQUISITION_TYPES.PurchaseRequisitionRepository,
      ),
      Quotation: container.get(QUOTATION_TYPES.QuotationRepository),
      QuotationRequest: container.get(
        QUOTATION_REQUEST_TYPES.QuotationRequestRepository,
      ),
      ReferralCode: container.get(REFERRAL_CODE_TYPES.ReferralCodeRepository),
      Role: container.get(ROLE_TYPES.RoleRepository),
      Service: container.get(SERVICE_TYPES.ServiceRepository),
      ShippingPlan: container.get(SHIPPING_PLAN_TYPES.ShippingPlanRepository),
      StockDocument: container.get(
        STOCK_DOCUMENT_TYPES.StockDocumentRepository,
      ),
      User: container.get(USER_TYPES.UserRepository),
      Warehouse: container.get(WAREHOUSE_TYPES.WarehouseRepository),
      WarehouseTransfer: container.get(
        WAREHOUSE_TRANSFER_TYPES.WarehouseTransferRepository,
      ),
      PartnerDebtAdjustment: container.get(
        PARTNER_DEBT_ADJUSTMENT_TYPES.PartnerDebtAdjustmentRepository,
      ),
      PartnerDebtOffset: container.get(
        PARTNER_DEBT_OFFSET_TYPES.PartnerDebtOffsetRepository,
      ),
      VatDebtAdjustment: container.get(
        VAT_DEBT_ADJUSTMENT_TYPES.VatDebtAdjustmentRepository,
      ),
    };

    return this.repoMap;
  }

  /**
   * Reset cache (dùng khi cần refresh repositories)
   */
  static reset(): void {
    this.repoMap = null;
  }
}
