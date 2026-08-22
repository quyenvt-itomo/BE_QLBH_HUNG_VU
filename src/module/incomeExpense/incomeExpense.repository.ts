import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { IncomeExpense } from "@/database/models/company/IncomeExpense";
import {
  IncomeExpenseSelectFull,
  IncomeExpenseRelations,
} from "./incomeExpense.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { IncomeExpenseQueryDto } from "./incomeExpense.validator";

@injectable()
export class IncomeExpenseRepository extends BaseRepository<IncomeExpense> {
  protected entityClass = IncomeExpense;
  protected selectedFields = IncomeExpenseSelectFull;
  protected relations = IncomeExpenseRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<IncomeExpense>,
    options: IFindPaginationOptions<IncomeExpense>,
  ): Promise<void> {
    const alias = qb.alias;
    const {
      type,
      fundId,
      partnerId,
      orderId,
      purchaseId,
      staffId,
      categoryId,
    } = (options?.moreQuery as IncomeExpenseQueryDto) || {};

    if (type) {
      qb.andWhere(`${alias}.type = :type`, { type });
    }
    if (fundId) {
      qb.andWhere(`${alias}.fundId = :fundId`, { fundId });
    }
    if (partnerId) {
      qb.andWhere(`${alias}.partnerId = :partnerId`, { partnerId });
    }
    if (orderId) {
      qb.andWhere(`${alias}.orderId = :orderId`, { orderId });
    }
    if (purchaseId) {
      qb.andWhere(`${alias}.purchaseId = :purchaseId`, { purchaseId });
    }
    if (staffId) {
      qb.andWhere(`${alias}.staffId = :staffId`, { staffId });
    }
    if (categoryId) {
      qb.andWhere(`${alias}.categoryId = :categoryId`, { categoryId });
    }
  }
}
