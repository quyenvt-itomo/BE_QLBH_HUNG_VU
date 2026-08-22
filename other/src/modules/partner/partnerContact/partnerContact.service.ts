import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { PartnerContactRepository } from "./partnerContact.repository";
import { PARTNER_CONTACT_TYPES } from "./partnerContact.types";
import { PartnerContact } from "@/database/models/PartnerContact";
import { Request } from "express";
import { DeepPartial, EntityManager } from "typeorm";
import { PartnerContactCreateParamsDto } from "./partnerContact.validator";

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

  async validateBeforeCreate(
    data: DeepPartial<PartnerContact>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    const { partnerId } = req?.params as PartnerContactCreateParamsDto;
    data.partnerId = partnerId;
  }

  async validateBeforeUpdate(
    id: string,
    data: Partial<PartnerContact>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    const { partnerId } = req?.params as PartnerContactCreateParamsDto;
    data.partnerId = partnerId;
  }
}
