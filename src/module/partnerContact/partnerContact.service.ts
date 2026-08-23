import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { PartnerContact } from "@/database/models";
import { PARTNER_CONTACT_TYPES } from "./partnerContact.types";
import { PartnerContactRepository } from "./partnerContact.repository";

/**
 * PartnerContact Service - Tenant Entity
 */
@injectable()
export class PartnerContactService extends BaseService<PartnerContact> {
  protected repository: PartnerContactRepository;
  protected uniqueFields: (keyof PartnerContact)[] = ["email", "phone"];
  protected uniqueScope: (keyof PartnerContact)[] = ["partnerId"];
  protected searchableFields = ["name", "phone", "email", "note"];

  constructor(
    @inject(PARTNER_CONTACT_TYPES.PartnerContactRepository)
    employeeRepository: PartnerContactRepository,
  ) {
    super();
    this.repository = employeeRepository;
  }
}
