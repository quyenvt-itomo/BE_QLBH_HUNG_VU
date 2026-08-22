import { injectable, inject } from "inversify";
import { Request } from "express";
import { BaseService } from "@/shared/base/BaseService";
import { PartnerSubTypeRepository } from "./partnerSubType.repository";
import { PARTNER_SUB_TYPE_TYPES } from "./partnerSubType.types";
import { PartnerSubType } from "@/database/models/PartnerSubType";
import { DeepPartial, EntityManager } from "typeorm";
import { PartnerSubTypeCreateParamsDto } from "./partnerSubType.validator";

/**
 * PartnerSubType Service - Tenant Entity
 */
@injectable()
export class PartnerSubTypeService extends BaseService<PartnerSubType> {
  protected repository: PartnerSubTypeRepository;
  protected uniqueFields: (keyof PartnerSubType)[] = ["type"];
  protected uniqueScope: (keyof PartnerSubType)[] = ["partnerId"];
  protected searchableFields = ["note"]; // Note from BaseEntity

  constructor(
    @inject(PARTNER_SUB_TYPE_TYPES.PartnerSubTypeRepository)
    repository: PartnerSubTypeRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<PartnerSubType>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    const { partnerId } = req?.params as PartnerSubTypeCreateParamsDto;
    data.partnerId = partnerId;
  }

  async validateBeforeUpdate(
    id: string,
    data: Partial<PartnerSubType>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    const { partnerId } = req?.params as PartnerSubTypeCreateParamsDto;
    data.partnerId = partnerId;
  }
}
