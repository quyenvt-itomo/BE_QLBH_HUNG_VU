import { injectable, inject } from "inversify";
import { FundRepository } from "./fund.repository";
import { FUND_TYPES } from "./fund.types";
import {
  FUND_TRANSACTION_TYPES,
  FundTransactionRecalculate,
  FundTransactionService,
} from "../fundTransaction";
import { Fund } from "@/database/models/Fund";
import { FundRelations, FundSelectFull } from "./fund.select";
import { BaseService, IFindOptions } from "@/shared/base/BaseService";
import { Request } from "express";
import { DeepPartial, EntityManager } from "typeorm";
import { generateCode } from "@/shared/utils/code.utils";
import { FundAdjustment } from "@/database/models/FundAdjustment";
import { FundTransactionTypeEnum } from "@/shared/constants/enum";
import dayjs from "dayjs";
import { BadRequestError } from "@/shared/types/errors";
import { ErrorsMessages } from "@/shared/constants/errors";

@injectable()
export class FundService extends BaseService<Fund> {
  protected repository: FundRepository;
  protected findOptions = {};
  protected relations = FundRelations;
  protected selectedFields = FundSelectFull;
  protected uniqueFields: (keyof Fund)[] = ["code"];
  protected uniqueScope: (keyof Fund)[] = ["storeId"];
  protected searchableFields = [
    "code",
    "name",
    "bank",
    "accountNumber",
    "accountHolderName",
    "branch",
  ];
  constructor(
    @inject(FUND_TYPES.FundRepository) repository: FundRepository,
    @inject(FUND_TRANSACTION_TYPES.FundTransactionService)
    protected fundTransactionService: FundTransactionService,
    @inject(FUND_TRANSACTION_TYPES.FundTransactionRecalculate)
    protected fundTransactionRecaculate: FundTransactionRecalculate,
  ) {
    super();
    this.repository = repository;
  }

  protected async attachMoreDataToEntities(
    entities: Fund[],
    options: IFindOptions<Fund>,
  ): Promise<void> {
    const { offsetAt = new Date() } = (options as any) || {};

    await this.fundTransactionService.enrichFundsWithBalance(
      entities,
      offsetAt,
    );
  }

  async validateBeforeCreate(
    data: DeepPartial<Fund>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    if (!data.storeId) {
      throw new BadRequestError("Thiếu cửa hàng cho quỹ", {
        field: "storeId",
        code: ErrorsMessages.required,
      });
    }

    const initialBalance: number = (data as any).initialBalance || 0;
    delete (data as any).initialBalance;

    if (initialBalance > 0) {
      const code = await generateCode(FundAdjustment);
      data.fundAdjustments = [
        {
          occurredAt: dayjs().toDate(),
          expectedAmount: initialBalance,
          reason: "Số dư ban đầu",
          code,
          countedAmount: 0,
          deltaAmount: initialBalance,
          direction: FundTransactionTypeEnum.INCREASE,
          isInitialAdjustment: true,
        },
      ];
    }

    // nếu là quỹ đầu tiên của cửa hàng thì sẽ là quỹ mặc định
    const count = await this.count({ where: { storeId: data.storeId } as any });
    if (count === 0) {
      data.isDefault = true;
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<Fund>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    if ((data as any).storeId !== undefined) {
      throw new BadRequestError("Không được phép thay đổi cửa hàng của quỹ", {
        field: "storeId",
        code: ErrorsMessages.invalid,
      });
    }
  }

  async actionAfterCreate(
    data: Fund,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    const occurredAt = dayjs().subtract(1, "minute").toDate();
    await this.fundTransactionRecaculate.recalculateFromDate(
      occurredAt,
      manager,
      [data.id],
    );
  }

  async actionAfterUpdate(
    data: Fund,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    if (data.isDefault) {
      // nếu là quỹ mặc định thì set các quỹ khác cùng cửa hàng về false
      await manager
        .createQueryBuilder()
        .update(Fund)
        .set({ isDefault: false })
        .where("id != :id", { id: data.id })
        .andWhere("storeId = :storeId", { storeId: data.storeId })
        .andWhere("isDefault = :isDefault", { isDefault: true })
        .execute();
    }
  }
}
