import { ContainerModule } from "inversify";
import { PartnerSubTypeController } from "./partnerSubType.controller";
import { PartnerSubTypeService } from "./partnerSubType.service";
import { PartnerSubTypeRepository } from "./partnerSubType.repository";
import { PartnerSubTypeRouter } from "./partnerSubType.route";
import { PARTNER_SUB_TYPE_TYPES } from "./partnerSubType.types";

const partnerSubTypeModule = new ContainerModule((bind) => {
  bind<PartnerSubTypeService>(PARTNER_SUB_TYPE_TYPES.PartnerSubTypeService).to(
    PartnerSubTypeService,
  );
  bind<PartnerSubTypeController>(
    PARTNER_SUB_TYPE_TYPES.PartnerSubTypeController,
  ).to(PartnerSubTypeController);
  bind<PartnerSubTypeRepository>(
    PARTNER_SUB_TYPE_TYPES.PartnerSubTypeRepository,
  ).to(PartnerSubTypeRepository);
  bind<PartnerSubTypeRouter>(PARTNER_SUB_TYPE_TYPES.PartnerSubTypeRouter).to(
    PartnerSubTypeRouter,
  );
});

export { partnerSubTypeModule };
