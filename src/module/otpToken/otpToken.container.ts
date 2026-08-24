import { ContainerModule } from "inversify";
import { OtpTokenRepository } from "./otpToken.repository";
import { OtpTokenService } from "./otpToken.service";
import { OtpTokenController } from "./otpToken.controller";
import { OtpTokenRouter } from "./otpToken.route";
import { OTP_TOKEN_TYPES } from "./otpToken.types";

export const otpTokenModule = new ContainerModule((bind) => { bind(OTP_TOKEN_TYPES.Repository).to(OtpTokenRepository).inSingletonScope(); bind(OTP_TOKEN_TYPES.Service).to(OtpTokenService).inSingletonScope(); bind(OTP_TOKEN_TYPES.Controller).to(OtpTokenController).inSingletonScope(); bind(OTP_TOKEN_TYPES.Router).to(OtpTokenRouter).inSingletonScope(); });
