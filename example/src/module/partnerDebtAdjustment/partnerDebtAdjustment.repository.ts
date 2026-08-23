import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { PartnerDebtAdjustment } from "@/database/models/company/PartnerDebtAdjustment";
import {
  PartnerDebtAdjustmentSelectFull,
  PartnerDebtAdjustmentRelations,
} from "./partnerDebtAdjustment.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { PartnerDebtAdjustmentQueryDto } from "./partnerDebtAdjustment.validator";

@injectable()
export class PartnerDebtAdjustmentRepository extends BaseRepository<PartnerDebtAdjustment> {
  protected entityClass = PartnerDebtAdjustment;
  protected selectedFields = PartnerDebtAdjustmentSelectFull;
  protected relations = PartnerDebtAdjustmentRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<PartnerDebtAdjustment>,
    options: IFindPaginationOptions<PartnerDebtAdjustment>,
  ): Promise<void> {
    const alias = qb.alias;
    const { partnerId, side, type, isInitial } =
      (options?.moreQuery as PartnerDebtAdjustmentQueryDto) || {};

    if (partnerId) {
      qb.andWhere(`${alias}.partnerId = :partnerId`, { partnerId });
    }
    if (side) {
      qb.andWhere(`${alias}.side = :side`, { side });
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
