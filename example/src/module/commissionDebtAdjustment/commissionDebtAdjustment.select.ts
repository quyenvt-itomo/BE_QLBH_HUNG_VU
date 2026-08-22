import { CommissionDebtAdjustment } from "@/database/models/company/CommissionDebtAdjustment";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const CommissionDebtAdjustmentSelectFull: FindOptionsSelect<CommissionDebtAdjustment> =
  {
    ...BaseSelect,
    companyId: true,
    code: true,
    occurredAt: true,
    partnerContactId: true,
    partnerContactSnapshot: true,
    expectedAmount: true,
    countedAmount: true,
    deltaAmount: true,
    type: true,
    reason: true,
    isInitialAdjustment: true,
    partnerContact: {
      id: true,
      name: true,
      phone: true,
      email: true,
    },
  };

export const CommissionDebtAdjustmentRelations: FindOptionsRelations<CommissionDebtAdjustment> =
  {
    partnerContact: true,
  };
