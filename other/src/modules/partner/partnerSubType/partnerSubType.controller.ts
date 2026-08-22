import { injectable, inject } from "inversify";
import { PartnerSubTypeService } from "./partnerSubType.service";
import { PARTNER_SUB_TYPE_TYPES } from "./partnerSubType.types";
import { BaseController } from "@/shared/base/BaseController";
import { PartnerSubType } from "@/database/models/PartnerSubType";

/**
 * PartnerSubType Controller - Tenant Entity
 */
@injectable()
export class PartnerSubTypeController extends BaseController<PartnerSubType> {
  protected service: PartnerSubTypeService;

  constructor(
    @inject(PARTNER_SUB_TYPE_TYPES.PartnerSubTypeService)
    service: PartnerSubTypeService,
  ) {
    super();
    this.service = service;
  }
}
