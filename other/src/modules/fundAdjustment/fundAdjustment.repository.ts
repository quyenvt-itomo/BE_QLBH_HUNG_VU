import { injectable } from "inversify";
import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { FundAdjustment } from "@/database/models/FundAdjustment";
import {
  FundAdjustmentRelations,
  FundAdjustmentSelectFull,
} from "./fundAdjustment.select";
import { SelectQueryBuilder } from "typeorm";

@injectable()
export class FundAdjustmentRepository extends BaseRepository<FundAdjustment> {
  protected entityClass = FundAdjustment;
  protected selectedFields = FundAdjustmentSelectFull;
  protected relations = FundAdjustmentRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<FundAdjustment>,
    options: IFindPaginationOptions<FundAdjustment>,
  ): Promise<void> {
    await super.extendQueryBuilder?.(qb, options);

    const { fundIds, storeId } = options?.moreQuery || {};

    if (fundIds) {
      qb.andWhere(`${qb.alias}.fundId IN (:...fundIds)`, { fundIds });
    }

    if (storeId) {
      qb.innerJoin(`${qb.alias}.fund`, "fund");
      qb.andWhere("fund.storeId = :storeId", { storeId });
    }
  }
}
