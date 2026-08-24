import { PartnerContact } from "@/database/models/PartnerContact";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const PartnerContactSelectBasic: FindOptionsSelect<PartnerContact> = {
  ...BaseSelect,
  name: true,
  email: true,
  phone: true,
  banks: true,
  partnerId: true,
  partner: { id: true, type: true, name: true, code: true, phone: true },
};
export const PartnerContactSelectList = PartnerContactSelectBasic;

export const PartnerContactSelectFull: FindOptionsSelect<PartnerContact> = {
  ...PartnerContactSelectBasic,
};

export const PartnerContactRelations: FindOptionsRelations<PartnerContact> = {
  partner: true,
};
export const PartnerContactRelationsList: FindOptionsRelations<PartnerContact> = {
  partner: true,
};
