import { Fund } from "@/database/models/Fund";
import { FundSelectFull, FundRelations } from "./fund.select";
import { injectable } from "inversify";
import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { SelectQueryBuilder } from "typeorm";

@injectable()
export class FundRepository extends BaseRepository<Fund> {
  protected entityClass = Fund;
  protected selectedFields = FundSelectFull;
  protected relations = FundRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Fund>,
    options: IFindPaginationOptions<Fund>,
  ): Promise<void> {
    super.extendQueryBuilder?.(qb, options);

    const { storeId } = options?.moreQuery || {};

    if (storeId) {
      qb.andWhere(`${qb.alias}.storeId = :storeId`, { storeId });
    }
  }
}
