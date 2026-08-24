import { inject, injectable } from "inversify";
import { OtpToken } from "@/database/models/OtpToken";
import { BaseService } from "@/shared/base/BaseService";
import { OtpTokenRepository } from "./otpToken.repository";
import { OTP_TOKEN_TYPES } from "./otpToken.types";
@injectable()
export class OtpTokenService extends BaseService<OtpToken> { protected repository: OtpTokenRepository; constructor(@inject(OTP_TOKEN_TYPES.Repository) repository: OtpTokenRepository) { super(); this.repository = repository; } async validateBeforeCreate(): Promise<void> { throw new Error("otpToken.internal_only"); } async validateBeforeUpdate(): Promise<void> { throw new Error("otpToken.internal_only"); } async validateBeforeDelete(): Promise<void> { throw new Error("otpToken.internal_only"); } }
