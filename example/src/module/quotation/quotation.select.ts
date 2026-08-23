import { Quotation } from "@/database/models/company/Quotation";
import { BaseSelect, RelationSelectConfig } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const QuotationSelectList: FindOptionsSelect<Quotation> = {
  ...BaseSelect,
  storeId: true,
  code: true,
  timeAt: true,
  validUntil: true,
  quotationRequestId: true,

  customerId: true,
  customerSnapshot: true,

  staffId: true,
  staffSnapshot: true,

  meshSpecId: true,
  meshSpecSnapshot: true,

  additionalInfo: true,

  subTotal: true,
  taxAmount: true,
  totalAmount: true,
  totalCommissionAmount: true,

  approveStatus: true,
  approvedAt: true,

  approverId: true,
  approverSnapshot: true,

  rejectReason: true,

  lines: true,
  commissions: true,
};

export const QuotationSelectFull: FindOptionsSelect<Quotation> = {
  ...QuotationSelectList,
  customer: true,
  staff: true,
  meshSpec: true,
  approver: true,
  quotationRequest: true,
  lines: {
    id: true,
    quotationId: true,
    type: true,
    productId: true,
    productSnapshot: true,
    product: {
      baseUnit: true,
      extraUnits: { unit: true },
    },
    serviceId: true,
    serviceSnapshot: true,
    unitId: true,
    unitSnapshot: true,
    unit: true,
    rawQuantity: true,
    rawUnitPrice: true,
    rawSubTotal: true,
    rawMaterialQuantity: true,
    rawMaterialUnitPrice: true,
    rawAdditionalCost: true,
    rawMaterialTotalCost: true,
    rawProfit: true,
    quantity: true,
    unitPrice: true,
    taxRate: true,
    subTotal: true,
    taxAmount: true,
    grossAmount: true,
    commissionAmount: true,
    materialId: true,
    materialSnapshot: true,
    note: true,
    sortOrder: true,
    commissionDetails: {
      id: true,
      quotationCommissionId: true,
      quotationLineId: true,
      price: true,
      priceAmount: true,
      priceTaxRate: true,
      priceTaxRateAmount: true,
      quantity: true,
      quantityAmount: true,
      quantityTaxRate: true,
      quantityTaxRateAmount: true,
      totalAmount: true,
    },
  },
  commissions: {
    id: true,
    quotationId: true,
    partnerContactId: true,
    partnerContactSnapshot: true,
    totalAmount: true,
    details: {
      id: true,
      quotationCommissionId: true,
      quotationLineId: true,
      price: true,
      priceAmount: true,
      priceTaxRate: true,
      priceTaxRateAmount: true,
      quantity: true,
      quantityAmount: true,
      quantityTaxRate: true,
      quantityTaxRateAmount: true,
      totalAmount: true,
    },
  },
};

export const QuotationRelationsList: FindOptionsRelations<Quotation> = {
  customer: { group: true },
  staff: true,
  approver: true,
};

export const QuotationRelations: FindOptionsRelations<Quotation> = {
  ...QuotationRelationsList,
  lines: {
    product: {
      baseUnit: true,
      extraUnits: { unit: true },
    },
    unit: true,
    commissionDetails: true,
  },
  commissions: {
    partnerContact: true,
    details: true,
  },
  meshSpec: true,
  quotationRequest: true,
};

export const QuotationRelationSelectsForList: RelationSelectConfig<Quotation> =
  {
    customer: [
      "id",
      "name",
      "code",
      "taxCode",
      "phone",
      "email",
      "address",
      "group",
    ],
    staff: ["id", "name", "code", "phone", "email"],
    approver: ["id", "name", "code", "phone", "email"],
  };

export const QuotationRelationSelects: RelationSelectConfig<Quotation> = {
  ...QuotationRelationSelectsForList,
  lines: {
    product: {
      baseUnit: true,
      extraUnits: { unit: ["id", "name"] },
    },
    unit: ["id", "name"],
    commissionDetails: true,
  },
  commissions: {
    partnerContact: ["id", "name", "phone", "email"],
    details: true,
  },
  meshSpec: ["id", "code", "timeAt"],
  quotationRequest: ["id", "code"],
};
