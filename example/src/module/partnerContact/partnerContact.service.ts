import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { PartnerContactRepository } from "./partnerContact.repository";
import { PARTNER_CONTACT_TYPES } from "./partnerContact.types";
import { PartnerContact } from "@/database/models/company/PartnerContact";

@injectable()
export class PartnerContactService extends BaseService<PartnerContact> {
  protected repository: PartnerContactRepository;
  protected searchableFields = ["name", "phone", "email"];

  constructor(
    @inject(PARTNER_CONTACT_TYPES.PartnerContactRepository)
    repository: PartnerContactRepository,
  ) {
    super();
    this.repository = repository;
  }
}
