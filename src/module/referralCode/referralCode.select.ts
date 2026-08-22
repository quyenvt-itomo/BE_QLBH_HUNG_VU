import { FindOptionsRelations } from "typeorm";
import { ReferralCode } from "@/database/models/company/ReferralCode";

export const ReferralCodeRelations: FindOptionsRelations<ReferralCode> = {
  purchaseRequisition: true,
  staff: true,
  partner: true,
};
