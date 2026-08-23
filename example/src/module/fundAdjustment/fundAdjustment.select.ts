import { FundAdjustment } from "@/database/models/company/FundAdjustment";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const FundAdjustmentSelectFull: FindOptionsSelect<FundAdjustment> = {
  ...BaseSelect,
  companyId: true,
  code: true,
  occurredAt: true,
  fundId: true,
  fundSnapshot: true,
  expectedAmount: true,
  countedAmount: true,
  deltaAmount: true,
  type: true,
  reason: true,
  isInitial: true,
  fund: {
    id: true,
    code: true,
    name: true,
    type: true,
  },
};

export const FundAdjustmentRelations: FindOptionsRelations<FundAdjustment> = {
  fund: true,
};
