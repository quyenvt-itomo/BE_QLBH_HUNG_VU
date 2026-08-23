import { Partner } from "@/database/models/Partner";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const PartnerSelectBasic: FindOptionsSelect<Partner> = {
  ...BaseSelect,
  isOrganization: true,
  type: true,
  groupId: true,
  name: true,
  code: true,
  email: true,
  phone: true,
  taxCode: true,
  addresses: true,
  representative: true,
  banks: true,
  maxDebtAmount: true,
};

export const PartnerSelectFull: FindOptionsSelect<Partner> = {
  ...PartnerSelectBasic,
  group: true,
  contacts: true,
};

export const PartnerRelations: FindOptionsRelations<Partner> = {
  group: true,
  contacts: true,
};
