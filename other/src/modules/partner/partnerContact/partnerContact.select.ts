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
};

export const PartnerContactSelectFull: FindOptionsSelect<PartnerContact> = {
  ...PartnerContactSelectBasic,
};

export const PartnerContactRelations: FindOptionsRelations<PartnerContact> = {
  partner: true,
};
