import { injectable, inject } from "inversify";
import { PartnerContactService } from "./partnerContact.service";
import { PARTNER_CONTACT_TYPES } from "./partnerContact.types";
import { BaseController } from "@/shared/base/BaseController";
import { PartnerContact } from "@/database/models/PartnerContact";

@injectable()
export class PartnerContactController extends BaseController<PartnerContact> {
  protected service: PartnerContactService;

  constructor(
    @inject(PARTNER_CONTACT_TYPES.PartnerContactService)
    service: PartnerContactService,
  ) {
    super();
    this.service = service;
  }
}
