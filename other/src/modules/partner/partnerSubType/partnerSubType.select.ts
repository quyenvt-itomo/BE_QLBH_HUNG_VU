import { PartnerSubType } from "@/database/models/PartnerSubType";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const PartnerSubTypeSelectBasic: FindOptionsSelect<PartnerSubType> = {
  ...BaseSelect,
  partnerId: true,
  type: true,
  groupId: true,
};

export const PartnerSubTypeSelectFull: FindOptionsSelect<PartnerSubType> = {
  ...PartnerSubTypeSelectBasic,
  group: true,
};

export const PartnerSubTypeRelations: FindOptionsRelations<PartnerSubType> = {
  group: true,
};
