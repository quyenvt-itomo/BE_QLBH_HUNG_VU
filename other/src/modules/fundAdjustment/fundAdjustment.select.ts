import { FundAdjustment } from "@/database/models/FundAdjustment";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const FundAdjustmentSelectBasic: FindOptionsSelect<FundAdjustment> = {
  ...BaseSelect,
  code: true,
  occurredAt: true,
  fundId: true,
  countedAmount: true,
  expectedAmount: true,
  deltaAmount: true,
  reason: true,
  direction: true,
};

export const FundAdjustmentSelectFull: FindOptionsSelect<FundAdjustment> = {
  ...FundAdjustmentSelectBasic,
  fund: { store: true },
};

export const FundAdjustmentRelations: FindOptionsRelations<FundAdjustment> = {
  fund: { store: true },
};
