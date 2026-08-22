import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { VatDebtAdjustment } from "@/database/models/company/VatDebtAdjustment";
import {
  VatDebtAdjustmentSelectFull,
  VatDebtAdjustmentRelations,
} from "./vatDebtAdjustment.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { VatDebtAdjustmentQueryDto } from "./vatDebtAdjustment.validator";

@injectable()
export class VatDebtAdjustmentRepository extends BaseRepository<VatDebtAdjustment> {
  protected entityClass = VatDebtAdjustment;
  protected selectedFields = VatDebtAdjustmentSelectFull;
  protected relations = VatDebtAdjustmentRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<VatDebtAdjustment>,
    options: IFindPaginationOptions<VatDebtAdjustment>,
  ): Promise<void> {
    const alias = qb.alias;
    const { adjustedById, type, isInitialAdjustment } =
      (options?.moreQuery as VatDebtAdjustmentQueryDto) || {};

    if (adjustedById) {
      qb.andWhere(`${alias}.adjustedById = :adjustedById`, { adjustedById });
    }
    if (type) {
      qb.andWhere(`${alias}.type = :type`, { type });
    }
    if (isInitialAdjustment !== undefined) {
      qb.andWhere(`${alias}.isInitialAdjustment = :isInitialAdjustment`, {
        isInitialAdjustment,
      });
    }
  }
}
