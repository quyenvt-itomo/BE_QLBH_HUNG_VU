import { LoyaltyPointAdjustment } from "@/database/models/LoyaltyPointAdjustment";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const LoyaltyPointAdjustmentSelectBasic: FindOptionsSelect<LoyaltyPointAdjustment> =
  {
    ...BaseSelect,
    code: true,
    occurredAt: true,
    partnerId: true,
    direction: true,
    expectedRevenue: true,
    countedRevenue: true,
    expectedPoints: true,
    countedPoints: true,
    deltaPoints: true,
    reason: true,
  };

export const LoyaltyPointAdjustmentSelectFull: FindOptionsSelect<LoyaltyPointAdjustment> =
  {
    ...LoyaltyPointAdjustmentSelectBasic,
    partner: true,
  };

export const LoyaltyPointAdjustmentRelations: FindOptionsRelations<LoyaltyPointAdjustment> =
  {
    partner: true,
  };
