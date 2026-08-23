import { VatDebtAdjustment } from "@/database/models/VatDebtAdjustment";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const VatDebtAdjustmentSelectFull: FindOptionsSelect<VatDebtAdjustment> =
  {
    ...BaseSelect,
    code: true,
    occurredAt: true,
    adjustedById: true,
    adjustedBySnapshot: true,
    expectedAmount: true,
    countedAmount: true,
    deltaAmount: true,
    type: true,
    reason: true,
    isInitial: true,
    adjustedBy: {
      id: true,
      name: true,
      code: true,
    },
  };

export const VatDebtAdjustmentRelations: FindOptionsRelations<VatDebtAdjustment> =
  {
    adjustedBy: true,
  };
