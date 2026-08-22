// =====================================================
// SYSTEM-WIDE MODELS (không thuộc company)
// =====================================================
import { Attribute } from "./Attribute";
import { File } from "./File";
import { Notification } from "./Notification";
import { Organization } from "./Organization";
import { TeamOperation } from "./TeamOperation";
import { User } from "./User";
import { CompanyUser } from "./CompanyUser";
import { LoginApproval } from "./LoginApproval";
import { OtpToken } from "./OtpToken";
import { OperationLog } from "./OperationLog";

// =====================================================
// COMPANY-SCOPED MODELS
// =====================================================
// --- Danh mục gốc ---
import { JobPosition } from "./company/JobPosition";
import { Employee } from "./company/Employee";
import { EmployeeContract } from "./company/EmployeeContract";
import { Role } from "./company/Role";
import { Partner } from "./company/Partner";
import { PartnerContact } from "./company/PartnerContact";
import { PaymentTerm } from "./company/PaymentTerm";
import { Service } from "./company/Service";
import { ServiceUnit } from "./company/ServiceUnit";

// --- Hàng hóa & Định mức ---
import { Product } from "./company/Product";
import { ProductExtraUnit } from "./company/ProductExtraUnit";
import { ProductPriceHistory } from "./company/ProductPriceHistory";
import { BillOfMaterial } from "./company/BillOfMaterial";
import { BOMOperation } from "./company/BOMOperation";
import { BOMOperationMaterial } from "./company/BOMOperationMaterial";

// --- Kho ---
import { Warehouse } from "./company/Warehouse";
import { WarehouseTransfer } from "./company/WarehouseTransfer";
import { WarehouseTransferLine } from "./company/WarehouseTransferLine";
import { InventoryAdjustment } from "./company/InventoryAdjustment";
import { InventoryAdjustmentLine } from "./company/InventoryAdjustmentLine";
import { InventoryConversion } from "./company/InventoryConversion";
import { InventoryConversionLine } from "./company/InventoryConversionLine";
import { InventoryTransaction } from "./company/InventoryTransaction";

// --- Cổng bảo vệ ---
import { GateLog } from "./company/GateLog";

// --- Mua hàng ---
import { ReferralCode } from "./company/ReferralCode";
import { PurchaseRequisition } from "./company/PurchaseRequisition";
import { PurchaseRequisitionLine } from "./company/PurchaseRequisitionLine";
import { PurchaseQuotation } from "./company/PurchaseQuotation";
import { PurchaseQuotationLine } from "./company/PurchaseQuotationLine";
import { Purchase } from "./company/Purchase";
import { PurchaseLine } from "./company/PurchaseLine";

// --- Bán hàng ---
import { QuotationRequest } from "./company/QuotationRequest";
import { QuotationRequestLine } from "./company/QuotationRequestLine";
import { Quotation } from "./company/Quotation";
import { QuotationLine } from "./company/QuotationLine";
import { QuotationCommission } from "./company/QuotationCommission";
import { QuotationCommissionDetail } from "./company/QuotationCommissionDetail";
import { Order } from "./company/Order";
import { OrderLine } from "./company/OrderLine";
import { OrderCommission } from "./company/OrderCommission";
import { OrderCommissionDetail } from "./company/OrderCommissionDetail";

// --- Chứng từ kho ---
import { StockDocument } from "./company/StockDocument";
import { StockDocumentLine } from "./company/StockDocumentLine";

// --- Sản xuất ---
import { Production } from "./company/Production";
import { ProductionMaterial } from "./company/ProductionMaterial";
import { ProductionMeshLine } from "./company/ProductionMeshLine";
import { ProductionNormalLine } from "./company/ProductionNormalLine";
import { ProductionReceiver } from "./company/ProductionReceiver";
import { ProductionSteelDrawingLine } from "./company/ProductionSteelDrawingLine";
import { MeshSpec } from "./company/MeshSpec";
import { MeshSpecLine } from "./company/MeshSpecLine";

// --- Kế toán: Hóa đơn ---
import { Invoice } from "./company/Invoice";
import { InvoiceAllocation } from "./company/InvoiceAllocation";

// --- Kế toán: Công nợ ---
import { PartnerDebtTransaction } from "./company/PartnerDebtTransaction";
import { PartnerDebtAdjustment } from "./company/PartnerDebtAdjustment";
import { PartnerDebtOffset } from "./company/PartnerDebtOffset";
import { PartnerDebtOffsetLine } from "./company/PartnerDebtOffsetLine";
import { CommissionDebtTransaction } from "./company/CommissionDebtTransaction";
import { CommissionDebtAdjustment } from "./company/CommissionDebtAdjustment";
import { CommissionAllocation } from "./company/CommissionAllocation";

// --- Kế toán: Quỹ ---
import { Fund } from "./company/Fund";
import { FundTransaction } from "./company/FundTransaction";
import { FundAdjustment } from "./company/FundAdjustment";
import { FundTransfer } from "./company/FundTransfer";

// --- Kế toán: Thu chi ---
import { IncomeExpense } from "./company/IncomeExpense";

// --- Kế toán: Thuế VAT ---
import { VatDebtTransaction } from "./company/VatDebtTransaction";
import { VatDebtAdjustment } from "./company/VatDebtAdjustment";

// --- Kế toán: Đề nghị thanh toán ---
import { PaymentRequest } from "./company/PaymentRequest";
import { PaymentRequestLine } from "./company/PaymentRequestLine";

// --- Vận chuyển ---
import { ShippingPlan } from "./company/ShippingPlan";

export const entities = [
  // System-wide
  File,
  Attribute,
  Organization,
  TeamOperation,
  Notification,
  User,
  CompanyUser,
  LoginApproval,
  OtpToken,
  OperationLog,

  // Danh mục gốc
  JobPosition,
  Employee,
  EmployeeContract,
  Role,
  Partner,
  PartnerContact,
  PaymentTerm,
  Service,
  ServiceUnit,

  // Hàng hóa & Định mức
  Product,
  ProductExtraUnit,
  ProductPriceHistory,
  BillOfMaterial,
  BOMOperation,
  BOMOperationMaterial,

  // Kho
  Warehouse,
  WarehouseTransfer,
  WarehouseTransferLine,
  InventoryAdjustment,
  InventoryAdjustmentLine,
  InventoryConversion,
  InventoryConversionLine,
  InventoryTransaction,

  // Cổng bảo vệ
  GateLog,

  // Mua hàng
  ReferralCode,
  PurchaseRequisition,
  PurchaseRequisitionLine,
  PurchaseQuotation,
  PurchaseQuotationLine,
  Purchase,
  PurchaseLine,

  // Bán hàng
  QuotationRequest,
  QuotationRequestLine,
  Quotation,
  QuotationLine,
  QuotationCommission,
  QuotationCommissionDetail,
  Order,
  OrderLine,
  OrderCommission,
  OrderCommissionDetail,

  // Chứng từ kho
  StockDocument,
  StockDocumentLine,

  // Sản xuất
  Production,
  ProductionMaterial,
  ProductionMeshLine,
  ProductionNormalLine,
  ProductionReceiver,
  ProductionSteelDrawingLine,
  MeshSpec,
  MeshSpecLine,

  // Kế toán: Hóa đơn
  Invoice,
  InvoiceAllocation,

  // Kế toán: Công nợ
  PartnerDebtTransaction,
  PartnerDebtAdjustment,
  PartnerDebtOffset,
  PartnerDebtOffsetLine,
  CommissionDebtTransaction,
  CommissionDebtAdjustment,
  CommissionAllocation,

  // Kế toán: Quỹ
  Fund,
  FundTransaction,
  FundAdjustment,
  FundTransfer,

  // Kế toán: Thu chi
  IncomeExpense,

  // Kế toán: Thuế VAT
  VatDebtTransaction,
  VatDebtAdjustment,

  // Kế toán: Đề nghị thanh toán
  PaymentRequest,
  PaymentRequestLine,

  // Vận chuyển
  ShippingPlan,
];
