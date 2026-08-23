import { OtpTokenController } from "./otpToken.controller";
import { simpleRoutes } from "../_shared/simple.route";
export class OtpTokenRouter { constructor(private readonly controller: OtpTokenController) {} getRouter() { return simpleRoutes(this.controller, "report"); } }
