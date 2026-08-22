import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { LoyaltyPointAdjustment } from "@/database/models/LoyaltyPointAdjustment";
import {
  LoyaltyPointAdjustmentSelectFull,
  LoyaltyPointAdjustmentRelations,
} from "./loyaltyPointAdjustment.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { FundTransactionTypeEnum } from "@/shared/constants/enum";

/**
 * LoyaltyPointAdjustment Repository
 */
@injectable()
export class LoyaltyPointAdjustmentRepository extends BaseRepository<LoyaltyPointAdjustment> {
  protected entityClass = LoyaltyPointAdjustment;
  protected selectedFields = LoyaltyPointAdjustmentSelectFull;
  protected relations = LoyaltyPointAdjustmentRelations;
  protected nestedFileFields?: string[] | undefined = ["partner"];

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<LoyaltyPointAdjustment>,
    options: IFindPaginationOptions<LoyaltyPointAdjustment>,
  ): Promise<void> {
    await super.extendQueryBuilder?.(qb, options);

    // Tính giá trị chênh lệch = tổng (deltaPoints * direction)
    qb.addSelect(
      `
      COALESCE(
        (${qb.alias}.deltaPoints *
          CASE
            WHEN ${qb.alias}.direction = '${FundTransactionTypeEnum.INCREASE}' THEN 1
            ELSE -1
          END
        )::float8,
        0
      )
      `,
      "entity_totalAdjustmentPoints",
    );
  }
}
