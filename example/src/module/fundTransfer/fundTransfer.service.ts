import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { FundTransferRepository } from "./fundTransfer.repository";
import { FUND_TRANSFER_TYPES } from "./fundTransfer.types";
import { FundTransfer } from "@/database/models/company/FundTransfer";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import { FUND_TYPES, FundRepository } from "@/module/fund";

@injectable()
export class FundTransferService extends BaseService<FundTransfer> {
  protected repository: FundTransferRepository;
  protected uniqueFields: (keyof FundTransfer)[] = ["code"];
  protected uniqueScope?: (keyof FundTransfer)[] = ["companyId"];
  protected searchableFields = ["code"];

  constructor(
    @inject(FUND_TRANSFER_TYPES.FundTransferRepository)
    repository: FundTransferRepository,
    @inject(FUND_TYPES.FundRepository)
    private fundRepository: FundRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<FundTransfer>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.fromFundId) {
      data.fromFundSnapshot = await this.fundRepository.getSnapshot(
        data.fromFundId,
        manager,
      );
    }
    if (data.toFundId) {
      data.toFundSnapshot = await this.fundRepository.getSnapshot(
        data.toFundId,
        manager,
      );
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<FundTransfer>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.fromFundId !== undefined) {
      data.fromFundSnapshot = data.fromFundId
        ? await this.fundRepository.getSnapshot(data.fromFundId, manager)
        : null;
    }
    if (data.toFundId !== undefined) {
      data.toFundSnapshot = data.toFundId
        ? await this.fundRepository.getSnapshot(data.toFundId, manager)
        : null;
    }
  }
}
