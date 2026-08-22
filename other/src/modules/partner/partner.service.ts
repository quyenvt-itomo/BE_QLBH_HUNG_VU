import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { PartnerRepository } from "./partner.repository";
import { PARTNER_TYPES } from "./partner.types";
import { Partner } from "@/database/models/Partner";
import { Request } from "express";
import { DeepPartial, EntityManager } from "typeorm";
import { BadRequestError, IError } from "@/shared/types/errors";
import { PartnerSubType } from "@/database/models/PartnerSubType";
import { ErrorsMessages } from "@/shared/constants/errors";
import {
  PARTNER_CONTACT_TYPES,
  PartnerContactRepository,
} from "./partnerContact";
import { ApiResponse, IFindOptions } from "@/shared/types/interfaces";
import { IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { ApiResponseHandler } from "@/shared/utils/response.utils";
import { PartnerQueryByRoleDto } from "./partner.validator";
import { PartnerTypeEnum } from "@/shared/constants/enum";
import { PARTNER_DEBT_TYPES, PartnerDebtService } from "../partnerDebt";
// import { PARTNER_DEBT_TYPES } from "../partnerDebt/partnerDebt.types";
// import { PartnerDebtService } from "../partnerDebt/partnerDebt.service";

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
    @inject(PARTNER_CONTACT_TYPES.PartnerContactRepository)
    private partnerContactRepository: PartnerContactRepository,
    @inject(PARTNER_DEBT_TYPES.PartnerDebtService)
    private partnerDebtService: PartnerDebtService,
  ) {
    super();
    this.repository = partnerRepository;
  }

  async getByRole(
    role: PartnerTypeEnum | undefined,
    options: PartnerQueryByRoleDto,
  ): Promise<ApiResponse<Partner[]>> {
    const page = options.page || 1;
    const size = options.size || 20;

    const optionData: IFindPaginationOptions<Partner> = {
      skip: page,
      take: size,
      keyword: options.keyword,
      searchFields: ["name", "code", "email", "phone", "taxCode"],
    };

    const { data = [], total } = await this.repository.findByRole(
      role,
      optionData,
    );

    const { offsetAt = new Date(), storeId } = options;

    for (const partner of data) {
      const { payableDebtAmount, receivableDebtAmount } =
        await this.partnerDebtService.getDebtAtDate(
          partner.id,
          offsetAt,
          storeId,
        );
      (partner as any).payableDebtAmount = payableDebtAmount;
      (partner as any).receivableDebtAmount = receivableDebtAmount;
    }

    return ApiResponseHandler.getSuccess("OK", data, {
      totalRecords: total,
      size: size,
      currentPage: page,
      totalPages: Math.ceil(total / size),
      offsetAt,
    });
  }

  protected async attachMoreDataToEntity(
    entity: Partner,
    req?: Request,
  ): Promise<void> {
    const { offsetAt = new Date(), storeId } = (req?.query as any) || {};
    const { payableDebtAmount, receivableDebtAmount } =
      await this.partnerDebtService.getDebtAtDate(entity.id, offsetAt, storeId);
    (entity as any).payableDebtAmount = payableDebtAmount;
    (entity as any).receivableDebtAmount = receivableDebtAmount;
  }

  protected async attachMoreDataToEntities(
    entities: Partner[],
    options: IFindOptions<Partner>,
  ): Promise<void> {
    const { offsetAt = new Date(), storeId } = (options as any) || {};
    for (const entity of entities) {
      const { payableDebtAmount, receivableDebtAmount } =
        await this.partnerDebtService.getDebtAtDate(
          entity.id,
          offsetAt,
          storeId,
        );
      (entity as any).payableDebtAmount = payableDebtAmount;
      (entity as any).receivableDebtAmount = receivableDebtAmount;
    }
  }

  async validateSubTypes(
    data: DeepPartial<Partner>,
    subTypes: DeepPartial<PartnerSubType>[],
  ): Promise<IError[]> {
    const errors: IError[] = [];

    errors.push(...this.checkDuplicate(subTypes, ["type"], "subTypes"));

    // type của subType không được trùng với type của partner
    if (data.type) {
      subTypes.forEach((subType, index) => {
        if (subType.type === data.type) {
          errors.push({
            field: `subTypes.${index}.type`,
            code: ErrorsMessages.incorrect,
          });
        }
      });
    }

    return errors;
  }

  async validateBeforeCreate(
    data: DeepPartial<Partner>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    if (!data.isOrganization) {
      delete data.contacts;
      delete data.representative;
    }

    const { contacts, subTypes } = data;

    const errors: IError[] = [];

    if (contacts) {
      errors.push(
        ...this.checkDuplicate(contacts, ["email", "phone"], "contacts"),
      );
    }

    if (subTypes) {
      errors.push(...(await this.validateSubTypes(data, subTypes)));
    }

    if (errors.length > 0) {
      throw new BadRequestError("Validation Error", errors);
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: Partial<Partner>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    if (data.isOrganization === false) {
      delete data.contacts;
      delete data.representative;
      data.representative = null;
    }
  }

  async actionAfterUpdate(
    data: Partner,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    if (data.isOrganization === false) {
      await this.partnerContactRepository.deletesByPartnerId(data.id);
    }
  }
}
