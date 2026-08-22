import { ContainerModule } from "inversify";
import { PartnerController } from "./partner.controller";
import { PartnerService } from "./partner.service";
import { PartnerRepository } from "./partner.repository";
import { PartnerRouter } from "./partner.route";
import { PARTNER_TYPES } from "./partner.types";

const partnerModule = new ContainerModule((bind) => {
  bind<PartnerService>(PARTNER_TYPES.PartnerService).to(PartnerService);
  bind<PartnerController>(PARTNER_TYPES.PartnerController).to(
    PartnerController,
  );
  bind<PartnerRepository>(PARTNER_TYPES.PartnerRepository).to(
    PartnerRepository,
  );
  bind<PartnerRouter>(PARTNER_TYPES.PartnerRouter).to(PartnerRouter);
});

export { partnerModule };
