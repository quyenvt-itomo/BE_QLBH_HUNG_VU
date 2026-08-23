import { Partner } from "@/database/models/company/Partner";
import { PartnerContact } from "@/database/models/company/PartnerContact";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const PartnerContactSelect: FindOptionsSelect<PartnerContact> = {
  ...BaseSelect,
  partnerId: true,
  name: true,
  phone: true,
  email: true,
  banks: true,
};

export const PartnerSelectBasic: FindOptionsSelect<Partner> = {
  ...BaseSelect,
  storeId: true,
  types: true,
  groupId: true,
  name: true,
  code: true,
  email: true,
  phone: true,
  zaloLink: true,
  taxCode: true,
  address: true,
  representative: true,
  banks: true,
  staffId: true,
  paymentTermId: true,
};

export const PartnerSelectFull: FindOptionsSelect<Partner> = {
  ...PartnerSelectBasic,
  group: true,
  staff: { id: true, code: true, name: true },
  paymentTerm: true,
  contacts: PartnerContactSelect,
};

export const PartnerRelations: FindOptionsRelations<Partner> = {
  group: true,
  staff: true,
  paymentTerm: true,
  contacts: true,
};
