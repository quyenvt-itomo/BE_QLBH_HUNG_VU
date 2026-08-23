import { OtpToken } from "@/database/models/OtpToken";
import { SimpleService } from "../_shared/simple.service";
import { OtpTokenRepository } from "./otpToken.repository";
export class OtpTokenService extends SimpleService<OtpToken> { constructor(repository: OtpTokenRepository) { super(repository, "global"); } async validateBeforeCreate(): Promise<void> { throw new Error("otpToken.internal_only"); } async validateBeforeUpdate(): Promise<void> { throw new Error("otpToken.internal_only"); } async validateBeforeDelete(): Promise<void> { throw new Error("otpToken.internal_only"); } }
