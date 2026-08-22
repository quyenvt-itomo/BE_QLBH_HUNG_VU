import { FundAdjustment } from "@/database/models/FundAdjustment";
import { inject, injectable } from "inversify";
import { FUND_ADJUSTMENT_TYPES } from "./fundAdjustment.types";
import { FundAdjustmentRepository } from "./fundAdjustment.repository";
import {
  FundAdjustmentRelations,
  FundAdjustmentSelectFull,
} from "./fundAdjustment.select";
import { BaseService } from "@/shared/base/BaseService";
import { Request } from "express";
import { DeepPartial, EntityManager } from "typeorm";
import { FUND_TRANSACTION_TYPES } from "../fundTransaction/fundTransaction.types";
import { FundTransactionRecalculate } from "../fundTransaction/fundTransactionRecaculate.service";
import { FUND_TYPES } from "../fund/fund.types";
import { FundRepository } from "../fund/fund.repository";
import { BadRequestError } from "@/shared/types/errors";
import { ErrorsMessages } from "@/shared/constants/errors";

@injectable()
export class FundAdjustmentService extends BaseService<FundAdjustment> {
  protected repository: FundAdjustmentRepository;
  protected findOptions = {};
  protected relations = FundAdjustmentRelations;
  protected selectedFields = FundAdjustmentSelectFull;
  protected uniqueFields: (keyof FundAdjustment)[] = ["code"];
  protected searchableFields = ["code"];
  protected summaryFields: (keyof FundAdjustment)[] = [];
  protected timeField: keyof FundAdjustment = "occurredAt";
  constructor(
    @inject(FUND_ADJUSTMENT_TYPES.FundAdjustmentRepository)
    repository: FundAdjustmentRepository,
    @inject(FUND_TYPES.FundRepository)
    private fundRepository: FundRepository,
    @inject(FUND_TRANSACTION_TYPES.FundTransactionRecalculate)
    private fundTransactionRecalculate: FundTransactionRecalculate,
  ) {
    super();
    this.repository = repository;
  }

  private async validateFund(fundId?: string): Promise<void> {
    if (!fundId) return;

    const fund = await this.fundRepository.findOne({
      where: { id: fundId } as any,
      select: { id: true } as any,
    });

    if (!fund) {
      throw new BadRequestError("Quỹ không tồn tại", {
        field: "fundId",
        code: ErrorsMessages.not_found,
      });
    }
  }

  async validateBeforeCreate(
    data: DeepPartial<FundAdjustment>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.validateFund(data.fundId);
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<FundAdjustment>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    const current = await this.findById(id);
    await this.validateFund(data.fundId ?? current?.fundId);
  }

  async handleAfterChangedData(
    data: FundAdjustment,
    manager: EntityManager,
  ): Promise<void> {
    const oldData = await this.findById(data.id);

    const fromDate = this.getEarliestDate(data.occurredAt, oldData?.occurredAt);

    const fundIds = this.collectUniqueIds([data.fundId, oldData?.fundId]);

    await this.fundTransactionRecalculate.recalculateFromDate(
      fromDate,
      manager,
      fundIds,
    );
  }

  async actionAfterCreate(
    data: FundAdjustment,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }

  async actionAfterUpdate(
    data: FundAdjustment,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }

  async actionAfterDelete(
    data: FundAdjustment,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }
}
