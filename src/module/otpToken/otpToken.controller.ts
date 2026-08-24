import { inject, injectable } from "inversify";
import { OtpToken } from "@/database/models/OtpToken";
import { BaseController } from "@/shared/base/BaseController";
import { OtpTokenService } from "./otpToken.service";
import { OTP_TOKEN_TYPES } from "./otpToken.types";
@injectable()
export class OtpTokenController extends BaseController<OtpToken> { protected service: OtpTokenService; constructor(@inject(OTP_TOKEN_TYPES.Service) service: OtpTokenService) { super(); this.service = service; } }
