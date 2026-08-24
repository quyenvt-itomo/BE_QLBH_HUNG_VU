import { injectable } from "inversify";
import { OtpToken } from "@/database/models/OtpToken";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { OtpTokenRelations, OtpTokenRelationsList, OtpTokenSelectFull, OtpTokenSelectList } from "./otpToken.select";
@injectable()
export class OtpTokenRepository extends BaseRepository<OtpToken> {
  protected entityClass = OtpToken;
  protected selectedFields = OtpTokenSelectFull;
  protected selectedFieldsForList = OtpTokenSelectList;
  protected relations = OtpTokenRelations;
  protected relationsForList = OtpTokenRelationsList;
}
