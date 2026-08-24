import { createSimpleModule } from "../_shared/simple.bind";
import { OtpTokenRepository } from "./otpToken.repository";
import { OtpTokenService } from "./otpToken.service";
import { OtpTokenController } from "./otpToken.controller";
import { OtpTokenRouter } from "./otpToken.route";
import { OTP_TOKEN_TYPES } from "./otpToken.types";

export const otpTokenModule = createSimpleModule(
  OTP_TOKEN_TYPES,
  OtpTokenRepository,
  OtpTokenService,
  OtpTokenController,
  OtpTokenRouter,
);
