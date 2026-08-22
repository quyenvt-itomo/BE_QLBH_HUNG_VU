import { ContainerModule } from "inversify";
import { PARTNER_CONTACT_TYPES } from "./partnerContact.types";
import { PartnerContactController } from "./partnerContact.controller";
import { PartnerContactService } from "./partnerContact.service";
import { PartnerContactRepository } from "./partnerContact.repository";
import { PartnerContactRouter } from "./partnerContact.route";

export const partnerContactModule = new ContainerModule((bind) => {
  bind<PartnerContactController>(
    PARTNER_CONTACT_TYPES.PartnerContactController,
  ).to(PartnerContactController);
  bind<PartnerContactService>(PARTNER_CONTACT_TYPES.PartnerContactService).to(
    PartnerContactService,
  );
  bind<PartnerContactRepository>(
    PARTNER_CONTACT_TYPES.PartnerContactRepository,
  ).to(PartnerContactRepository);
  bind<PartnerContactRouter>(PARTNER_CONTACT_TYPES.PartnerContactRouter).to(
    PartnerContactRouter,
  );
});
