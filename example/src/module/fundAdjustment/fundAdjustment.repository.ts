import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { FundAdjustment } from "@/database/models/company/FundAdjustment";
import {
  FundAdjustmentSelectFull,
  FundAdjustmentRelations,
} from "./fundAdjustment.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { FundAdjustmentQueryDto } from "./fundAdjustment.validator";

@injectable()
export class FundAdjustmentRepository extends BaseRepository<FundAdjustment> {
  protected entityClass = FundAdjustment;
  protected selectedFields = FundAdjustmentSelectFull;
  protected relations = FundAdjustmentRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<FundAdjustment>,
    options: IFindPaginationOptions<FundAdjustment>,
  ): Promise<void> {
    const alias = qb.alias;
    const { fundId, type, isInitial } =
      (options?.moreQuery as FundAdjustmentQueryDto) || {};

    if (fundId) {
      qb.andWhere(`${alias}.fundId = :fundId`, { fundId });
    }
    if (type) {
      qb.andWhere(`${alias}.type = :type`, { type });
    }
    if (isInitial !== undefined) {
      qb.andWhere(`${alias}.isInitial = :isInitial`, {
        isInitial,
      });
    }
  }
}
