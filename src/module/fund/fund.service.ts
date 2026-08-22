import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { FundRepository } from "./fund.repository";
import { FUND_TYPES } from "./fund.types";
import { Fund } from "@/database/models/company/Fund";
import { FundTypeEnum } from "@/database/models/company/Fund";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import { BadRequestError } from "@/shared/types/errors";

@injectable()
export class FundService extends BaseService<Fund> {
  protected repository: FundRepository;
  protected uniqueFields: (keyof Fund)[] = ["code"];
  protected uniqueScope?: (keyof Fund)[] = ["companyId"];
  protected searchableFields = ["code", "name"];

  constructor(
    @inject(FUND_TYPES.FundRepository)
    repository: FundRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<Fund>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.type === FundTypeEnum.CASH && !data.storeId) {
      throw new BadRequestError("Quỹ tiền mặt bắt buộc thuộc một chi nhánh");
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<Fund>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const current = await this.repository.findById(id, manager);
    const type = data.type ?? current?.type;
    const storeId = data.storeId !== undefined ? data.storeId : current?.storeId;
    if (type === FundTypeEnum.CASH && !storeId) {
      throw new BadRequestError("Quỹ tiền mặt bắt buộc thuộc một chi nhánh");
    }
  }
}
