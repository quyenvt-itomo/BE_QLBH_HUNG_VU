import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { CommissionDebtAdjustment } from "@/database/models/company/CommissionDebtAdjustment";
import {
  CommissionDebtAdjustmentSelectFull,
  CommissionDebtAdjustmentRelations,
} from "./commissionDebtAdjustment.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { CommissionDebtAdjustmentQueryDto } from "./commissionDebtAdjustment.validator";

@injectable()
export class CommissionDebtAdjustmentRepository extends BaseRepository<CommissionDebtAdjustment> {
  protected entityClass = CommissionDebtAdjustment;
  protected selectedFields = CommissionDebtAdjustmentSelectFull;
  protected relations = CommissionDebtAdjustmentRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<CommissionDebtAdjustment>,
    options: IFindPaginationOptions<CommissionDebtAdjustment>,
  ): Promise<void> {
    const alias = qb.alias;
    const { partnerContactId, type, isInitial } =
      (options?.moreQuery as CommissionDebtAdjustmentQueryDto) || {};

    if (partnerContactId) {
      qb.andWhere(`${alias}.partnerContactId = :partnerContactId`, {
        partnerContactId,
      });
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
