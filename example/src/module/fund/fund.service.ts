import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { FundRepository } from "./fund.repository";
import { FUND_TYPES } from "./fund.types";
import { Fund } from "@/database/models/company/Fund";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";

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
  ): Promise<void> {}

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<Fund>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}
}
