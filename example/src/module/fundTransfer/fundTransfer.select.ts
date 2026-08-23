import { FundTransfer } from "@/database/models/company/FundTransfer";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const FundTransferSelectFull: FindOptionsSelect<FundTransfer> = {
  ...BaseSelect,
  storeId: true,
  code: true,
  occurredAt: true,
  reason: true,
  fromFundId: true,
  fromFundSnapshot: true,
  toFundId: true,
  toFundSnapshot: true,
  amount: true,
  fromFund: {
    id: true,
    code: true,
    name: true,
  },
  toFund: {
    id: true,
    code: true,
    name: true,
  },
};

export const FundTransferRelations: FindOptionsRelations<FundTransfer> = {
  fromFund: true,
  toFund: true,
};
