import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FundTransfer } from "@/database/models/FundTransfer";

export const FundTransferSelectList: FindOptionsSelect<FundTransfer> = {
  ...BaseSelect, code: true, occurredAt: true, fromFundId: true,
  toFundId: true, amount: true,
};
export const FundTransferSelectFull: FindOptionsSelect<FundTransfer> = {
  ...FundTransferSelectList,
  fromFund: { id: true, code: true, name: true, type: true, storeId: true },
  toFund: { id: true, code: true, name: true, type: true, storeId: true },
} as any;
export const FundTransferRelationsList: FindOptionsRelations<FundTransfer> = { fromFund: true, toFund: true };
export const FundTransferRelations: FindOptionsRelations<FundTransfer> = FundTransferRelationsList;
