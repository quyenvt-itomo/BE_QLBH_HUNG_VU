import { ContainerModule } from "inversify";
import { REFERRAL_CODE_TYPES } from "./referralCode.types";
import { ReferralCodeController } from "./referralCode.controller";
import { ReferralCodeService } from "./referralCode.service";
import { ReferralCodeRepository } from "./referralCode.repository";
import { ReferralCodeRouter } from "./referralCode.route";

const referralCodeModule = new ContainerModule((bind) => {
  bind(REFERRAL_CODE_TYPES.ReferralCodeController).to(ReferralCodeController);
  bind(REFERRAL_CODE_TYPES.ReferralCodeService).to(ReferralCodeService);
  bind(REFERRAL_CODE_TYPES.ReferralCodeRepository).to(ReferralCodeRepository);
  bind(REFERRAL_CODE_TYPES.ReferralCodeRouter).to(ReferralCodeRouter);
});

export default referralCodeModule;
