import { ContainerModule } from "inversify";
import { PartnerContactController } from "./partnerContact.controller";
import { PartnerContactService } from "./partnerContact.service";
import { PartnerContactRepository } from "./partnerContact.repository";
import { PartnerContactRouter } from "./partnerContact.route";
import { PARTNER_CONTACT_TYPES } from "./partnerContact.types";

const partnerContactModule = new ContainerModule((bind) => {
  bind<PartnerContactService>(PARTNER_CONTACT_TYPES.PartnerContactService).to(
    PartnerContactService,
  );
  bind<PartnerContactController>(
    PARTNER_CONTACT_TYPES.PartnerContactController,
  ).to(PartnerContactController);
  bind<PartnerContactRepository>(
    PARTNER_CONTACT_TYPES.PartnerContactRepository,
  ).to(PartnerContactRepository);
  bind<PartnerContactRouter>(PARTNER_CONTACT_TYPES.PartnerContactRouter).to(
    PartnerContactRouter,
  );
});

export { partnerContactModule };
