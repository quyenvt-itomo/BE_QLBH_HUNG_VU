import { PartnerContact } from "@/database/models/PartnerContact";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const PartnerContactSelectFull: FindOptionsSelect<PartnerContact> = {
  ...BaseSelect,
  partnerId: true,
  name: true,
  phone: true,
  email: true,
  banks: true,
};

export const PartnerContactRelations: FindOptionsRelations<PartnerContact> = {};
