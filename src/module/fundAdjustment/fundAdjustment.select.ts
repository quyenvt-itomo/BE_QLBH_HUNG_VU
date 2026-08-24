import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FundAdjustment } from "@/database/models/FundAdjustment";

export const FundAdjustmentSelectList: FindOptionsSelect<FundAdjustment> = {
  ...BaseSelect, code: true, occurredAt: true, fundId: true, fundSnapshot: true,
  expectedAmount: true, countedAmount: true, deltaAmount: true, reason: true, isInitial: true,
  fund: { id: true, code: true, name: true, type: true, storeId: true },
};
export const FundAdjustmentSelectFull: FindOptionsSelect<FundAdjustment> = {
  ...FundAdjustmentSelectList,
  fund: { id: true, code: true, name: true, type: true, storeId: true },
} as any;
export const FundAdjustmentRelationsList: FindOptionsRelations<FundAdjustment> = { fund: true };
export const FundAdjustmentRelations: FindOptionsRelations<FundAdjustment> = { fund: true };
