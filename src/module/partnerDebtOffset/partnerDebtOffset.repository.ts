import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { PartnerDebtOffset } from "@/database/models/PartnerDebtOffset";
import {
  PartnerDebtOffsetSelectFull,
  PartnerDebtOffsetRelations,
} from "./partnerDebtOffset.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { PartnerDebtOffsetQueryDto } from "./partnerDebtOffset.validator";

@injectable()
export class PartnerDebtOffsetRepository extends BaseRepository<PartnerDebtOffset> {
  protected entityClass = PartnerDebtOffset;
  protected selectedFields = PartnerDebtOffsetSelectFull;
  protected relations = PartnerDebtOffsetRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<PartnerDebtOffset>,
    options: IFindPaginationOptions<PartnerDebtOffset>,
  ): Promise<void> {
    const alias = qb.alias;
    const { partnerId } =
      (options?.moreQuery as PartnerDebtOffsetQueryDto) || {};

    if (partnerId) {
      qb.andWhere(`${alias}.partnerId = :partnerId`, { partnerId });
    }
  }
}
