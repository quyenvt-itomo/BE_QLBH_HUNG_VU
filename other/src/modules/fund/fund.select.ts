import { Fund } from "@/database/models/Fund";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const FundSelectBasic: FindOptionsSelect<Fund> = {
  id: true,
  storeId: true,
  code: true,
  name: true,
  type: true,
  bank: true,
  accountNumber: true,
  accountHolderName: true,
  branch: true,
  note: true,
};

export const FundSelectFull: FindOptionsSelect<Fund> = {
  ...FundSelectBasic,
  store: true,
};

export const FundRelations: FindOptionsRelations<Fund> = {
  store: true,
};
