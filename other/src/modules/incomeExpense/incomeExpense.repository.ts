import { inject, injectable } from "inversify";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import {
  IncomeExpenseRelations,
  IncomeExpenseSelectFull,
} from "./incomeExpense.select";
import { SelectQueryBuilder } from "typeorm";
import { IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { IncomeExpenseQueryDto } from "./incomeExpense.validator";
import { FilterItem } from "@/shared/types/interfaces";
import { FUND_CATEGORY_TYPES, FundCategoryRepository } from "../fundCategory";
import {
  AttributeTypeEnum,
  FundTypeEnum,
  IncomeExpenseTypeEnum,
} from "@/shared/constants/enum";
import { ATTRIBUTE_TYPES, AttributeRepository } from "../attribute";

@injectable()
export class IncomeExpenseRepository extends BaseRepository<IncomeExpense> {
  protected entityClass = IncomeExpense;
  protected selectedFields = IncomeExpenseSelectFull;
  protected relations = IncomeExpenseRelations;

  constructor(
    @inject(FUND_CATEGORY_TYPES.FundCategoryRepository)
    private categoryRepository: FundCategoryRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepository: AttributeRepository,
  ) {
    super();
  }

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<IncomeExpense>,
    options: IFindPaginationOptions<IncomeExpense>,
  ): Promise<void> {
    // giữ nguyên logic cha (nếu có)
    super.extendQueryBuilder?.(qb, options);

    const {
      fundIds,
      categoryId,
      fundCategoryGroupId,
      employeeIds,
      partnerIds,
      storeId,
    } = options?.moreQuery || {};

    if (categoryId) {
      qb.andWhere(`${qb.alias}.categoryId = :categoryId`, {
        categoryId: options.moreQuery.categoryId,
      });
    } else if (fundCategoryGroupId) {
      qb.innerJoin("FundCategory", "fc", `${qb.alias}.categoryId = fc.id`);
      qb.andWhere(`fc.fundCategoryGroupId = :fundCategoryGroupId`, {
        fundCategoryGroupId: options.moreQuery.fundCategoryGroupId,
      });
    }

    if (this.checkArrayFilter(fundIds))
      qb.andWhere(`${qb.alias}.fundId IN (:...fundIds)`, {
        fundIds: options.moreQuery.fundIds,
      });

    if (this.checkArrayFilter(employeeIds))
      qb.andWhere(`${qb.alias}.creatorId IN (:...employeeIds)`, {
        employeeIds: options.moreQuery.employeeIds,
      });

    if (this.checkArrayFilter(partnerIds))
      qb.andWhere(`${qb.alias}.partnerId IN (:...partnerIds)`, {
        partnerIds: options.moreQuery.partnerIds,
      });

    if (storeId) {
      qb.andWhere(`${qb.alias}.storeId = :storeId`, {
        storeId: options.moreQuery.storeId,
      });
    }
  }

  async aggregateShiftSummary(
    storeId: string,
    startAt: Date,
    endAt?: Date | null,
    req?: any,
  ) {
    const qb = await this.createQueryBuilder("ie");

    qb.leftJoin("ie.fund", "f")
      .select([
        // Tổng tiền thu được theo đơn hàng
        `SUM(ie.amount) FILTER (WHERE ie.type = :income AND ie.orderId IS NOT NULL) as total_income_from_orders`,

        // Tổng tiền mặt thu được theo đơn hàng
        `SUM(ie.amount) FILTER (
            WHERE ie.type = :income AND ie.orderId IS NOT NULL AND f.type = :cash
          ) as total_cash_income_from_orders`,

        // Tổng tiền mặt thu được không theo đơn hàng
        `SUM(ie.amount) FILTER (
            WHERE ie.type = :income AND ie.orderId IS NULL AND f.type = :cash
          ) as total_cash_income_without_orders`,

        // Tổng tiền chi ra  không theo đơn hàng
        `SUM(ie.amount) FILTER (
            WHERE ie.type = :expense AND ie.orderId IS NULL AND f.type = :cash
          ) as total_cash_expense_without_orders`,
      ])
      .where("ie.storeId = :storeId")
      .andWhere("ie.occurredAt >= :startAt");

    // Only filter by endAt if shift is closed
    if (endAt) {
      qb.andWhere("ie.occurredAt <= :endAt");
    }

    const params: any = {
      storeId,
      income: IncomeExpenseTypeEnum.INCOME,
      expense: IncomeExpenseTypeEnum.EXPENSE,
      cash: FundTypeEnum.CASH,
      startAt,
    };

    if (endAt) {
      params.endAt = endAt;
    }

    const result = await qb.setParameters(params).getRawOne();

    return {
      totalIncomeFromOrders: parseFloat(result.total_income_from_orders) || 0,
      totalCashIncomeFromOrders:
        parseFloat(result.total_cash_income_from_orders) || 0,
      totalCashIncomeWithoutOrders:
        parseFloat(result.total_cash_income_without_orders) || 0,
      totalCashExpenseWithoutOrders:
        parseFloat(result.total_cash_expense_without_orders) || 0,
    };
  }

  async getFilterItems(query: IncomeExpenseQueryDto): Promise<FilterItem[]> {
    const { startAt, endAt, storeId, fundIds, employeeIds, partnerIds } = query;

    /**
     * 1. Lấy category + fundCategoryGroup
     */
    const categories = await this.categoryRepository.findByOptions({
      select: {
        id: true,
        name: true,
        fundCategoryGroupId: true,
      },
    });

    const fundCategoryGroups = await this.attributeRepository.findByOptions({
      select: {
        id: true,
        name: true,
        type: true,
      },
      where: [
        { type: AttributeTypeEnum.INCOME_CATEGORY },
        { type: AttributeTypeEnum.EXPENSE_CATEGORY },
      ],
    });

    if (!categories.length) return [];

    /**
     * 2. Query tổng amount theo categoryId
     */
    const qb = this.getRepository()
      .createQueryBuilder("ie")
      .select("ie.categoryId", "categoryId")
      .addSelect("COALESCE(SUM(ie.amount), 0)", "total")
      .groupBy("ie.categoryId");

    if (storeId) {
      qb.andWhere("ie.storeId = :storeId", { storeId });
    }

    if (fundIds?.length) {
      qb.andWhere("ie.fundId IN (:...fundIds)", { fundIds });
    }

    if (employeeIds?.length) {
      qb.andWhere("ie.creatorId IN (:...employeeIds)", { employeeIds });
    }

    if (partnerIds?.length) {
      qb.andWhere("ie.partnerId IN (:...partnerIds)", { partnerIds });
    }

    if (startAt) {
      qb.andWhere("ie.occurredAt >= :startAt", { startAt });
    }

    if (endAt) {
      qb.andWhere("ie.occurredAt <= :endAt", { endAt });
    }

    const rawTotals = await qb.getRawMany<{
      categoryId: string;
      total: string;
    }>();

    /**
     * 3. Map categoryId -> total
     */
    const categoryTotalMap = new Map<string, number>();
    for (const row of rawTotals) {
      categoryTotalMap.set(row.categoryId, Number(row.total));
    }

    /**
     * 4. Cộng dồn tổng cho fundCategoryGroup
     */
    const groupTotalMap = new Map<
      string,
      {
        id: string;
        name: string;
        type: AttributeTypeEnum;
        total: number;
      }
    >();
    for (const group of fundCategoryGroups) {
      groupTotalMap.set(group.id, {
        id: group.id,
        name: group.name,
        type: group.type,
        total: 0,
      });
    }

    for (const category of categories) {
      const total = categoryTotalMap.get(category.id) ?? 0;
      if (!total) continue;
      const existed = groupTotalMap.get(category.fundCategoryGroupId);
      if (!existed) continue;
      existed.total += total;
    }

    /**
     * 5. Build FilterItem[]
     */
    const filterItems: FilterItem[] = [];

    // 5.1 fundCategoryGroup
    for (const group of groupTotalMap.values()) {
      filterItems.push({
        id: group.id,
        name: group.name,
        type: group.type,
        value: group.total, // ✅ tổng amount
      });
    }
    // 5.2 category
    for (const category of categories) {
      const total = categoryTotalMap.get(category.id) ?? 0;
      const parent = filterItems.find(
        (fcg) => fcg.id === category.fundCategoryGroupId,
      );
      if (!parent) continue;
      filterItems.push({
        id: category.id,
        name: category.name,
        type: parent.type, // type của group cha
        parentId: parent.id, // để phân biệt với group cha
        value: total, // ✅ tổng amount
      });
    }
    return filterItems;
  }
}
