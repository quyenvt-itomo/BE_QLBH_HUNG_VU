import { VatDebtAdjustment } from "@/database/models/store/VatDebtAdjustment";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const VatDebtAdjustmentSelectBasic: FindOptionsSelect<VatDebtAdjustment> =
  {
    ...BaseSelect,
    code: true,
    occurredAt: true,
    expectedAmount: true,
    countedAmount: true,
    deltaAmount: true,
    direction: true,
    reason: true,
    storeId: true,
    adjustedById: true,
    adjustedBySnapshot: true,
  };

export const VatDebtAdjustmentSelectFull: FindOptionsSelect<VatDebtAdjustment> =
  {
    ...VatDebtAdjustmentSelectBasic,
    store: true,
    adjustedBy: true,
  };

export const VatDebtAdjustmentRelations: FindOptionsRelations<VatDebtAdjustment> =
  {
    store: true,
    adjustedBy: true,
  };
