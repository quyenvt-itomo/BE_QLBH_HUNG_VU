import { injectable } from "inversify";
import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { SelectQueryBuilder } from "typeorm";
import { IncomeExpenseRelations, IncomeExpenseRelationsList, IncomeExpenseSelectFull, IncomeExpenseSelectList } from "./incomeExpense.select";
import { IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { IncomeExpenseType } from "@/database/models/store/IncomeExpense";
import { nullUuidMap } from "@/shared/constants/enum";
@injectable()
export class IncomeExpenseRepository extends BaseRepository<IncomeExpense> {
  protected entityClass = IncomeExpense;
  protected selectedFields = IncomeExpenseSelectFull;
  protected selectedFieldsForList = IncomeExpenseSelectList;
  protected relations = IncomeExpenseRelations;
  protected relationsForList = IncomeExpenseRelationsList;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<IncomeExpense>,
    options: IFindPaginationOptions<IncomeExpense>,
  ): Promise<void> {
    const query = (options.moreQuery || {}) as Record<string, any>;
    const alias = qb.alias;
    const fundIds = query.fundIds?.length ? query.fundIds : query.fundId ? [query.fundId] : [];
    const partnerIds = query.partnerIds?.length
      ? query.partnerIds
      : query.partnerId
        ? [query.partnerId]
        : [];
    const orderIds = query.orderIds?.length ? query.orderIds : query.orderId ? [query.orderId] : [];

    if (query.categoryId) {
      if (query.categoryId === nullUuidMap.incomeCategory) {
        qb.andWhere(`${alias}.type = :incomeExpenseIncomeType`, {
          incomeExpenseIncomeType: IncomeExpenseType.INCOME,
        });
        qb.andWhere(`${alias}.categoryId IS NULL`);
      } else if (query.categoryId === nullUuidMap.expenseCategory) {
        qb.andWhere(`${alias}.type = :incomeExpenseExpenseType`, {
          incomeExpenseExpenseType: IncomeExpenseType.EXPENSE,
        });
        qb.andWhere(`${alias}.categoryId IS NULL`);
      } else {
        qb.andWhere(`${alias}.categoryId = :incomeExpenseCategoryId`, {
          incomeExpenseCategoryId: query.categoryId,
        });
      }
    }
    if (fundIds.length) qb.andWhere(`${alias}.fundId IN (:...incomeExpenseFundIds)`, { incomeExpenseFundIds: fundIds });
    if (partnerIds.length) qb.andWhere(`${alias}.partnerId IN (:...incomeExpensePartnerIds)`, { incomeExpensePartnerIds: partnerIds });
    if (orderIds.length) qb.andWhere(`${alias}.orderId IN (:...incomeExpenseOrderIds)`, { incomeExpenseOrderIds: orderIds });
  }
}
