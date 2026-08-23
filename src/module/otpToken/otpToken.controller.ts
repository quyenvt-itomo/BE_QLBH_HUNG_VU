import { OtpToken } from "@/database/models/OtpToken";
import { SimpleController } from "../_shared/simple.controller";
import { OtpTokenService } from "./otpToken.service";
export class OtpTokenController extends SimpleController<OtpToken> { constructor(service: OtpTokenService) { super(service); } }
