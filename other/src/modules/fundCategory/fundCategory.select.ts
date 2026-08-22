import { FundCategory } from "@/database/models/FundCategory";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const FundCategorySelectBasic: FindOptionsSelect<FundCategory> = {
  id: true,
  fundCategoryGroupId: true,
  name: true,
};

export const FundCategorySelectFull: FindOptionsSelect<FundCategory> = {
  ...FundCategorySelectBasic,
};

export const FundCategoryRelations: FindOptionsRelations<FundCategory> = {};
