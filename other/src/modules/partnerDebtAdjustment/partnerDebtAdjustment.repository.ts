import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { PartnerDebtAdjustment } from "@/database/models/store/PartnerDebtAdjustment";
import {
  PartnerDebtAdjustmentSelectFull,
  PartnerDebtAdjustmentRelations,
} from "./partnerDebtAdjustment.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { DebtDirectionEnum } from "@/shared/constants/enum";

/**
 * PartnerDebtAdjustment Repository - Tenant Entity
 * Sử dụng BaseRepository để truy vấn trên tenant schemas
 */
@injectable()
export class PartnerDebtAdjustmentRepository extends BaseRepository<PartnerDebtAdjustment> {
  protected entityClass = PartnerDebtAdjustment;
  protected selectedFields = PartnerDebtAdjustmentSelectFull;
  protected relations = PartnerDebtAdjustmentRelations;
  protected nestedFileFields?: string[] | undefined = ["partner", "adjustedBy"];

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<PartnerDebtAdjustment>,
    options: IFindPaginationOptions<PartnerDebtAdjustment>,
  ): Promise<void> {
    await super.extendQueryBuilder?.(qb, options);
    if (options?.moreQuery?.storeId) {
      qb.andWhere(`${qb.alias}.storeId = :storeId`, {
        storeId: options.moreQuery.storeId,
      });
    }

    if (options?.moreQuery?.side) {
      qb.andWhere(`${qb.alias}.side = :side`, {
        side: options.moreQuery.side,
      });
    }

    // Tính giá trị chênh lệch = tổng (adjustedAmount * direction) (không có line)
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
