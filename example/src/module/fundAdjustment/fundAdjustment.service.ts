import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { FundAdjustmentRepository } from "./fundAdjustment.repository";
import { FUND_ADJUSTMENT_TYPES } from "./fundAdjustment.types";
import { FundAdjustment } from "@/database/models/company/FundAdjustment";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import { FUND_TYPES, FundRepository } from "@/module/fund";

@injectable()
export class FundAdjustmentService extends BaseService<FundAdjustment> {
  protected repository: FundAdjustmentRepository;
  protected uniqueFields: (keyof FundAdjustment)[] = ["code"];
  protected uniqueScope?: (keyof FundAdjustment)[] = ["storeId"];
  protected searchableFields = ["code"];

  constructor(
    @inject(FUND_ADJUSTMENT_TYPES.FundAdjustmentRepository)
    repository: FundAdjustmentRepository,
    @inject(FUND_TYPES.FundRepository)
    private fundRepository: FundRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<FundAdjustment>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.fundId) {
      data.fundSnapshot = await this.fundRepository.getSnapshot(
        data.fundId,
        manager,
      );
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<FundAdjustment>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.fundId !== undefined) {
      data.fundSnapshot = data.fundId
        ? await this.fundRepository.getSnapshot(data.fundId, manager)
        : null;
    }
  }
}
