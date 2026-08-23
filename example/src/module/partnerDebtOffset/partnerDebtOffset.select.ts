import { PartnerDebtOffset } from "@/database/models/company/PartnerDebtOffset";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const PartnerDebtOffsetSelectFull: FindOptionsSelect<PartnerDebtOffset> =
  {
    ...BaseSelect,
    storeId: true,
    code: true,
    occurredAt: true,
    partnerId: true,
    partnerSnapshot: true,
    payableTotalAmount: true,
    receivableTotalAmount: true,
    offsetAmount: true,
    payableDebtAmount: true,
    receivableDebtAmount: true,
    reason: true,
    lines: {
      id: true,
      side: true,
      invoiceId: true,
      invoiceSnapshot: true,
      amount: true,
      invoiceCode: true,
      invoiceType: true,
    },
    partner: {
      id: true,
      code: true,
      name: true,
    },
  };

export const PartnerDebtOffsetRelations: FindOptionsRelations<PartnerDebtOffset> =
  {
    partner: true,
    lines: true,
  };
