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
  identityCode: true,
  gender: true,
  dob: true,
  address: true,
  representative: true,
  banks: true,
  maxDebtAmount: true,
  group: { id: true, name: true, type: true, parentId: true, storeId: true },
};
export const PartnerSelectList = PartnerSelectBasic;

export const PartnerSelectFull: FindOptionsSelect<Partner> = {
  ...PartnerSelectBasic,
  group: { id: true, name: true, type: true, parentId: true, storeId: true },
  contacts: {
    id: true,
    partnerId: true,
    name: true,
    email: true,
    phone: true,
    identityCode: true,
    banks: true,
  },
} as any;

export const PartnerRelations: FindOptionsRelations<Partner> = {
  group: true,
  contacts: true,
};
export const PartnerRelationsList: FindOptionsRelations<Partner> = {
  group: true,
};
