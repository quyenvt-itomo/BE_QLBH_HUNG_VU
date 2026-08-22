import { BaseRepository } from "@/shared/base/BaseRepository";
import { ReferralCode } from "@/database/models/company/ReferralCode";
import { ReferralCodeRelations } from "./referralCode.select";

export class ReferralCodeRepository extends BaseRepository<ReferralCode> {
  protected entityClass = ReferralCode;
  protected relations = ReferralCodeRelations;
}
