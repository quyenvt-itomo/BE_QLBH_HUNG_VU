import { injectable, inject } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { BaseService } from "@/shared/base/BaseService";
import { BadRequestError, IError } from "@/shared/types/errors";
import { RequestContext } from "@/shared/types/interfaces";
import { Partner } from "@/database/models";
import { PARTNER_TYPES } from "./partner.types";
import { PartnerRepository } from "./partner.repository";

/**
 * Partner Service - Tenant Entity
 */
@injectable()
export class PartnerService extends BaseService<Partner> {
  protected repository: PartnerRepository;
  protected uniqueFields: (keyof Partner)[] = ["code", "email", "phone"];
  protected searchableFields = [
    "name",
    "code",
    "email",
    "phone",
    "taxCode",
    "note",
    "group.name",
  ];

  constructor(
    @inject(PARTNER_TYPES.PartnerRepository)
    partnerRepository: PartnerRepository,
  ) {
    super();
    this.repository = partnerRepository;
  }

  async validateBeforeCreate(
    data: DeepPartial<Partner>,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (!data.isOrganization) {
      delete data.contacts;
      delete data.representative;
    }

    const { contacts } = data;

    const errors: IError[] = [];

    if (contacts) {
      errors.push(
        ...this.checkDuplicate(contacts, ["email", "phone"], "contacts"),
      );
    }

    if (errors.length > 0)
      throw new BadRequestError("Dữ liệu không hợp lệ", errors);
  }

  async validateBeforeUpdate(
    id: string,
    data: Partial<Partner>,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.isOrganization === false) {
      delete data.contacts;
      delete data.representative;
      data.representative = null;
    }
  }

}
