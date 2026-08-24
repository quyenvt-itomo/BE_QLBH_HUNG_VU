import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FundTransaction } from "@/database/models/FundTransaction";

export const FundTransactionSelectList: FindOptionsSelect<FundTransaction> = {
  ...BaseSelect, occurredAt: true, fundId: true, amount: true, type: true,
  refType: true, refId: true, refCode: true,
};
export const FundTransactionSelectFull: FindOptionsSelect<FundTransaction> = FundTransactionSelectList;
export const FundTransactionRelationsList: FindOptionsRelations<FundTransaction> = {};
export const FundTransactionRelations: FindOptionsRelations<FundTransaction> = {};
