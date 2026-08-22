import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { PartnerDebtOffset } from "@/database/models/store/PartnerDebtOffset";
import {
  PartnerDebtOffsetSelectFull,
  PartnerDebtOffsetRelations,
} from "./partnerDebtOffset.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";

/**
 * PartnerDebtOffset Repository - Tenant Entity
 * Sử dụng BaseRepository để truy vấn trên tenant schemas
 */
@injectable()
export class PartnerDebtOffsetRepository extends BaseRepository<PartnerDebtOffset> {
  protected entityClass = PartnerDebtOffset;
  protected selectedFields = PartnerDebtOffsetSelectFull;
  protected relations = PartnerDebtOffsetRelations;
  protected nestedFileFields?: string[] | undefined = ["partner", "offsetBy"];

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<PartnerDebtOffset>,
    options: IFindPaginationOptions<PartnerDebtOffset>,
  ): Promise<void> {
    super.extendQueryBuilder?.(qb, options);
    if (options?.moreQuery?.storeId) {
      qb.andWhere(`${qb.alias}.storeId = :storeId`, {
        storeId: options.moreQuery.storeId,
      });
    }
  }
}
