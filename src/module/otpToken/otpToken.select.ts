import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { OtpToken } from "@/database/models/OtpToken";

export const OtpTokenSelectList: FindOptionsSelect<OtpToken> = {
  ...BaseSelect, token: true, purpose: true, refId: true, sentToEmail: true,
  expiredAt: true, isUsed: true, attemptCount: true, isLocked: true,
};
export const OtpTokenSelectFull: FindOptionsSelect<OtpToken> = OtpTokenSelectList;
export const OtpTokenRelationsList: FindOptionsRelations<OtpToken> = {};
export const OtpTokenRelations: FindOptionsRelations<OtpToken> = {};
