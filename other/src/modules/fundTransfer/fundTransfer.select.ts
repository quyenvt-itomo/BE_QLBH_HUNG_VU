import { FundTransfer } from "@/database/models/FundTransfer";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const FundTransferSelectBasic: FindOptionsSelect<FundTransfer> = {
  ...BaseSelect,
  code: true,
  fromFundId: true,
  toFundId: true,
  amount: true,
  occurredAt: true,
};

export const FundTransferSelectFull: FindOptionsSelect<FundTransfer> = {
  ...FundTransferSelectBasic,
  fromFund: true,
  toFund: true,
};

export const FundTransferRelations: FindOptionsRelations<FundTransfer> = {
  fromFund: true,
  toFund: true,
};
