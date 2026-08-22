import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { FundTransfer } from "@/database/models/FundTransfer";
import { FundTransferRepository } from "./fundTransfer.repository";
import {
  FundTransferRelations,
  FundTransferSelectFull,
} from "./fundTransfer.select";
import { FUND_TRANSFER_TYPES } from "./fundTransfer.types";
import { DeepPartial, EntityManager, In } from "typeorm";
import { Request } from "express";
import { FUND_TRANSACTION_TYPES } from "../fundTransaction/fundTransaction.types";
import { FundTransactionRecalculate } from "../fundTransaction/fundTransactionRecaculate.service";
import { FUND_TYPES } from "../fund/fund.types";
import { FundRepository } from "../fund/fund.repository";
import { BadRequestError } from "@/shared/types/errors";
import { ErrorsMessages } from "@/shared/constants/errors";

@injectable()
export class FundTransferService extends BaseService<FundTransfer> {
  protected repository: FundTransferRepository;
  protected findOptions = {};
  protected relations = FundTransferRelations;
  protected selectedFields = FundTransferSelectFull;
  protected uniqueFields: (keyof FundTransfer)[] = ["code"];
  protected searchableFields = ["code", "note"];
  protected timeField: keyof FundTransfer = "occurredAt";
  protected summaryFields = ["amount"];
  constructor(
    @inject(FUND_TRANSFER_TYPES.FundTransferRepository)
    repository: FundTransferRepository,
    @inject(FUND_TYPES.FundRepository)
    private fundRepository: FundRepository,
    @inject(FUND_TRANSACTION_TYPES.FundTransactionRecalculate)
    private fundTransactionRecalculate: FundTransactionRecalculate,
  ) {
    super();
    this.repository = repository;
  }

  private async validateFundsInSameStore(
    fromFundId: string | undefined,
    toFundId: string | undefined,
  ): Promise<void> {
    if (!fromFundId || !toFundId) return;

    if (fromFundId === toFundId) {
      throw new BadRequestError("Không thể chuyển tiền trong cùng một quỹ", {
        field: "toFundId",
        code: ErrorsMessages.invalid,
      });
    }

    const funds = await this.fundRepository.findByOptions({
      where: { id: In([fromFundId, toFundId]) } as any,
      select: {
        id: true,
        storeId: true,
      } as any,
    });

    if (funds.length !== 2) {
      throw new BadRequestError("Quỹ chuyển không hợp lệ", {
        field: "fromFundId",
        code: ErrorsMessages.not_found,
      });
    }

    const fromFund = funds.find((fund) => fund.id === fromFundId);
    const toFund = funds.find((fund) => fund.id === toFundId);

    if (!fromFund || !toFund) {
      throw new BadRequestError("Quỹ chuyển không hợp lệ", {
        field: "fromFundId",
        code: ErrorsMessages.not_found,
      });
    }

    if ((fromFund as any).storeId !== (toFund as any).storeId) {
      throw new BadRequestError("Chỉ được chuyển quỹ trong cùng một cửa hàng", {
        field: "toFundId",
        code: ErrorsMessages.invalid,
      });
    }
  }

  async validateBeforeCreate(
    data: DeepPartial<FundTransfer>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.validateFundsInSameStore(data.fromFundId, data.toFundId);
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<FundTransfer>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    const current = await this.findById(id);

    await this.validateFundsInSameStore(
      data.fromFundId ?? current?.fromFundId,
      data.toFundId ?? current?.toFundId,
    );
  }

  async handleAfterChangedData(
    data: FundTransfer,
    manager: EntityManager,
  ): Promise<void> {
    const oldData = await this.findById(data.id);

    const fromDate = this.getEarliestDate(data.occurredAt, oldData?.occurredAt);

    const fundIds = this.collectUniqueIds([
      data.fromFundId,
      data.toFundId,
      oldData?.fromFundId,
      oldData?.toFundId,
    ]);

    await this.fundTransactionRecalculate.recalculateFromDate(
      fromDate,
      manager,
      fundIds,
    );
  }

  async actionAfterCreate(
    data: FundTransfer,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }

  async actionAfterUpdate(
    data: FundTransfer,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }

  async actionAfterDelete(
    data: FundTransfer,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }
}
