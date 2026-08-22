import { PartnerDebtAdjustment } from "@/database/models/company/PartnerDebtAdjustment";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const PartnerDebtAdjustmentSelectFull: FindOptionsSelect<PartnerDebtAdjustment> =
  {
    ...BaseSelect,
    companyId: true,
    code: true,
    occurredAt: true,
    side: true,
    partnerId: true,
    partnerSnapshot: true,
    invoiceId: true,
    invoiceSnapshot: true,
    expectedAmount: true,
    countedAmount: true,
    deltaAmount: true,
    type: true,
    reason: true,
    isInitialAdjustment: true,
    partner: {
      id: true,
      code: true,
      name: true,
    },
  };

export const PartnerDebtAdjustmentRelations: FindOptionsRelations<PartnerDebtAdjustment> =
  {
    partner: true,
  };
