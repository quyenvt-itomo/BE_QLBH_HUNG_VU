import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { VatDebtAdjustment } from "@/database/models/store/VatDebtAdjustment";
import {
  VatDebtAdjustmentSelectFull,
  VatDebtAdjustmentRelations,
} from "./vatDebtAdjustment.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { DebtDirectionEnum } from "@/shared/constants/enum";

/**
 * VatDebtAdjustment Repository - Tenant Entity
 * Sử dụng BaseRepository để truy vấn trên tenant schemas
 */
@injectable()
export class VatDebtAdjustmentRepository extends BaseRepository<VatDebtAdjustment> {
  protected entityClass = VatDebtAdjustment;
  protected selectedFields = VatDebtAdjustmentSelectFull;
  protected relations = VatDebtAdjustmentRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<VatDebtAdjustment>,
    options: IFindPaginationOptions<VatDebtAdjustment>,
  ): Promise<void> {
    super.extendQueryBuilder?.(qb, options);
    if (options?.moreQuery?.storeId) {
      qb.andWhere(`${qb.alias}.storeId = :storeId`, {
        storeId: options.moreQuery.storeId,
      });
    }

    qb.addSelect(
      `
        COALESCE(
          (${qb.alias}.deltaAmount *
            CASE
              WHEN ${qb.alias}.direction = '${DebtDirectionEnum.INCREASE}' THEN 1
              ELSE -1
            END
          )::float8,
        0
        )
          `,
      "entity_totalAdjustmentAmount",
    );
  }
}
