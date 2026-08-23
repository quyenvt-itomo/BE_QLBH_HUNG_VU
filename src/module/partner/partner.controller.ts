import { injectable, inject } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { Partner } from "@/database/models";
import { PARTNER_TYPES } from "./partner.types";
import { PartnerService } from "./partner.service";

/**
 * Partner Controller - Tenant Entity
 */
@injectable()
export class PartnerController extends BaseController<Partner> {
  protected service: PartnerService;

  constructor(
    @inject(PARTNER_TYPES.PartnerService) partnerService: PartnerService,
  ) {
    super();
    this.service = partnerService;
  }
}
