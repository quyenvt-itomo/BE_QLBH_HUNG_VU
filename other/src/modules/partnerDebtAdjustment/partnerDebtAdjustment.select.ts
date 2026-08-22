import { PartnerDebtAdjustment } from "@/database/models/store/PartnerDebtAdjustment";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const PartnerDebtAdjustmentSelectBasic: FindOptionsSelect<PartnerDebtAdjustment> =
  {
    ...BaseSelect,
    code: true,
    occurredAt: true,
    adjustedById: true,
    adjustedBySnapshot: true,
    side: true,
    partnerId: true,
    expectedAmount: true,
    countedAmount: true,
    deltaAmount: true,
    direction: true,
    reason: true,
    storeId: true,
  };

export const PartnerDebtAdjustmentSelectFull: FindOptionsSelect<PartnerDebtAdjustment> =
  {
    ...PartnerDebtAdjustmentSelectBasic,
    adjustedBy: true,
    partner: true,
    store: true,
  };

export const PartnerDebtAdjustmentRelations: FindOptionsRelations<PartnerDebtAdjustment> =
  {
    partner: true,
    adjustedBy: true,
    store: true,
  };
